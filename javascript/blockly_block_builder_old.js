defineFunctions(Blockly, {
    svgResize(workspace, width, height) {
        let mainWorkspace = workspace;
        while (mainWorkspace.options.parentWorkspace)
            mainWorkspace = mainWorkspace.options.parentWorkspace;
        let svg = mainWorkspace.getParentSvg();
        let container = svg.parentNode;
        if (!container)
            return;
        width = width != null ? width : container.offsetWidth;
        height = height != null ? height : container.offsetHeight;
        if (svg.cachedWidth_ != width) {
            svg.setAttribute("width", width + "px");
            svg.cachedWidth_ = width;
        }
        if (svg.cachedWidth_ != height) {
            svg.setAttribute("height", height + "px");
            svg.cachedHeight_ = height;
        }
        workspace.resize();
    }
});
// let toggle = () => {
//   let num = setTimeout(toggle, 2000);
//   if (num != 1) document.getElementById("code-hud").classList.toggle("shown");
// }
// toggle();
let editorToolbox = BlockTools.createXml('<category name="Fields"><block type="builder_block_definition"/><block type="builder_block_definition"><value name="name"><block type="builder_value_text"><field name="text">block_name</field></block><shadow type="builder_value_required"></shadow></value><value name="inputs"><shadow type="builder_value_inputs" editable="false"><field name="style">AUTO</field></shadow></value><value name="hue"><shadow type="builder_value_hue" editable="false"></shadow></value></block><block type="builder_field_text"><value name="text"><block type="builder_value_text"></block><shadow type="builder_value_required"></shadow></value></block><block type="builder_field_input"><value name="name"><block type="builder_value_text"></block><shadow type="builder_value_required"></shadow></value><value name="type"><shadow type="builder_type" editable="false"></shadow></value><value name="align"><shadow type="builder_value_alignment" editable="false"><field name="align">LEFT</field></shadow></value></block><block type="builder_field_statement"><value name="name"><block type="builder_value_text"></block><shadow type="builder_value_required"></shadow></value><value name="type"><shadow type="builder_type" editable="false"></shadow></value><value name="align"><shadow type="builder_value_alignment" editable="false"><field name="align">LEFT</field></shadow></value></block><block type="builder_connections_output"><value name="type"><shadow type="builder_type" editable="false"></shadow></value></block><block type="builder_connections_preceding"><value name="type"><shadow type="builder_type" editable="false"></shadow></value></block><block type="builder_connections_succeeding"><value name="type"><shadow type="builder_type" editable="false"></shadow></value></block><block type="builder_connections_both"><value name="preceding"><shadow type="builder_type" editable="false"></shadow></value><value name="succeeding"><shadow type="builder_type" editable="false"></shadow></value></block></category><category name="Values"><block type="builder_value_text"></block><block type="builder_value_inputs"><field name="style">AUTO</field></block><block type="builder_value_inputs"><field name="style">external</field></block><block type="builder_value_inputs"><field name="style">internal</field></block><block type="builder_value_alignment"><field name="align">LEFT</field></block><block type="builder_value_alignment"><field name="align">CENTRE</field></block><block type="builder_value_alignment"><field name="align">RIGHT</field></block><block type="builder_value_hue"></block></category><category name="Types" custom="TYPES"></category>');
let previewToolbox = BlockTools.createXml("");
let getNext = (block) => block.type.includes("connections") ? "connection" : { "builder_field_text": "text", "builder_field_input": "input", "builder_field_statement": "input" }[block.type];
let mapper = {
    "$main": {
        "$lit_content": [],
        "name": "name.text",
        "input_style": "inputs.style",
        "colour": "hue.hue",
        "$next": getNext
    },
    "text": {
        "content": "text.text",
        "$next": getNext
    },
    "input": {
        "content": {
            "$lit_type": function () { return this.block.type.split("_")[2]; },
            "name": "name.text",
            "$lit_check": function () { return types.toType(this.getValue("type.type")); },
            "alignment": "align.align"
        },
        "$next": getNext
    },
    "connection": {
        "$runme": function () {
            let name = this.block.type.split("_")[2];
            if (name == "both") {
                this.scope.succeeding = types.toType(this.block.getInputTargetBlock("succeeding").getFieldValue("type"));
                this.scope.preceding = types.toType(this.block.getInputTargetBlock("preceding").getFieldValue("type"));
            }
            else {
                this.scope[name] = types.toType(this.block.getInputTargetBlock("type").getFieldValue("type"));
            }
        }
    }
};
let types = new BlockTools.Types();
let generator = new BlockTools.CodeGenerator(mapper, "builder_block_definition");
let editorWorkspace;
let previewWorkspace;
let output;
class AmbiguityError extends AdvancedError {
    constructor(name) {
        super("Ambiguity between " + name + " names.");
        this.type = name;
    }
}
var Generators;
(function (Generators) {
    Generators.builder = (map, shared) => {
        if (!shared.names)
            shared.names = [];
        let code = new BlockTools.Code();
        let inputs = 0;
        if (shared.names.includes(map.name))
            code.pushProblem(new AmbiguityError("block"));
        shared.names.push(map.name);
        code.append('new BlockTools.Builder("', [null, "built_"], map.name.escape(), '")');
        for (let item of map.content) {
            code.append("\n\t");
            if (typeof item == "string") {
                code.append('.appendField("', item.escape(), '")');
            }
            else {
                code.append(".append", { "input": "Value", "statement": "Statement" }[item.type]);
                code.append('Input("', item.name.escape(), [null, (inputs++).toString()], '")');
                if (item.check)
                    code.append('.setCheck("', item.check.escape(), '")');
                if (item.alignment && item.alignment != "LEFT")
                    code.append('.setAlign("', item.alignment, '")');
            }
        }
        if (map.content && map.content.length > 0) {
            let content = map.content[map.content.length - 1];
            if (map.colour || map.output !== undefined || map.preceding !== undefined || map.succeeding !== undefined)
                code.append("\n\t");
            else if (typeof content == "string" && content.length > 20)
                code.append("\n\t");
            else if (typeof content == "object")
                code.append("\n\t");
        }
        else if (map.colour || map.output !== undefined || map.preceding !== undefined || map.succeeding !== undefined) {
            code.append("\n\t");
        }
        if (map.colour)
            code.append(".setColour(", map.colour, ")");
        if (map.output !== undefined)
            code.append(".setOutput(", map.output ? '"' + map.output.escape() + '"' : "true", ")");
        if (map.preceding !== undefined && map.preceding == map.succeeding)
            code.append(".setBothStatements(", map.preceding ? '"' + map.preceding.escape() + '"' : "true", ")");
        else {
            if (map.preceding !== undefined)
                code.append(".setPreviousStatement(", map.preceding ? '"' + map.preceding.escape() + '"' : "true", ")");
            if (map.succeeding !== undefined)
                code.append(".setNextStatement(", map.succeeding ? '"' + map.succeeding.escape() + '"' : "true", ")");
        }
        code.append(".register();");
        return code;
    };
})(Generators || (Generators = {}));
for (let gen in Generators) {
    generator.addGenerator(Generators[gen], gen);
}
let generate = () => {
    let codeHUD = document.getElementById("code-hud");
    let codeDisplay = codeHUD.getElementsByClassName("hud-display")[0];
    let code = generator.generate(editorWorkspace, "builder");
    let GeneratorError = BlockTools.CodeGenerator.GeneratorError;
    let errors = code.filter((code) => code instanceof GeneratorError);
    for (let error of errors) {
        let suppressed = error.suppressed;
        let message = {
            "MapperError": "Please fill in any REQUIRED blocks."
        }[Object.getPrototypeOf(suppressed).constructor.name];
        codeHUD.classList.add("shown");
        codeDisplay.textContent = message
            || "Something odd happened... Try refreshing the page? Debugging info has been left in the console.";
        if (!message)
            console.warn(...errors.map((err) => err.toString()));
        return;
    }
    let compiled = code.filter((code) => code instanceof BlockTools.Code)
        .reduce((code, prev, ind) => code.append("\n\n", prev));
    let errs = false;
    for (let problem of compiled.getProblems()) {
        let message = {
            "AmbiguityError": "Multiple block / input / field names!"
        }[Object.getPrototypeOf(problem).constructor.name];
        codeHUD.classList.add("shown");
        codeDisplay.textContent = message;
        errs = true;
    }
    if (!errs)
        codeHUD.classList.remove("shown");
    output.setValue(compiled.getShown(), 1);
    let beforeKeys = Object.keys(Blockly.Blocks).filter((key) => key.startsWith("built_"));
    for (let name in Blockly.Blocks)
        if (name.startsWith("built_"))
            delete Blockly.Blocks[name];
    eval(compiled.getUsed());
    let afterKeys = Object.keys(Blockly.Blocks).filter((key) => key.startsWith("built_"));
    let delKeys = beforeKeys.filter((key) => !afterKeys.includes(key));
    let newKeys = afterKeys.filter((key) => !beforeKeys.includes(key));
    let block;
    for (block of previewWorkspace.getAllBlocks()) {
        if (delKeys.includes(block.type)) {
            block.dispose(true, true);
            continue;
        }
        block.inputList.forEach((input) => input.dispose());
        block.inputList = [];
        block.render();
        Blockly.Blocks[block.type].init.call(block);
    }
    for (let key of newKeys) {
        Blockly.Xml.appendDomToWorkspace(BlockTools.createXml('<block type="' + key + '"/>'), previewWorkspace);
    }
};
let eventHandler = (event) => {
    if (!(event instanceof Blockly.Events.Ui)) {
        return generate();
        let code;
        try {
            code = generator.generate(editorWorkspace, "builder");
        }
        catch (error) {
            if (error instanceof BlockTools.CodeGenerator.GeneratorError) {
                error.suppressed;
            }
            else {
                throw error;
            }
        }
        output.setValue(code.getShown(), 1);
        let beforeKeys = Object.keys(Blockly.Blocks).filter((key) => key.startsWith("built_"));
        for (let name in Blockly.Blocks)
            if (name.startsWith("built_"))
                delete Blockly.Blocks[name];
        eval(code.getUsed());
        let afterKeys = Object.keys(Blockly.Blocks).filter((key) => key.startsWith("built_"));
        let delKeys = beforeKeys.filter((key) => !afterKeys.includes(key));
        let newKeys = afterKeys.filter((key) => !beforeKeys.includes(key));
        let block;
        for (block of previewWorkspace.getAllBlocks()) {
            if (delKeys.includes(block.type)) {
                block.dispose(true, true);
                continue;
            }
            block.inputList.forEach((input) => input.dispose());
            block.inputList = [];
            block.render();
            Blockly.Blocks[block.type].init.call(block);
        }
        for (let key of newKeys) {
            Blockly.Xml.appendDomToWorkspace(BlockTools.createXml('<block type="' + key + '"/>'), previewWorkspace);
        }
    }
};
var loaded = () => {
    // Load editor
    editorWorkspace = Blockly.inject("editor-workspace", {
        "toolbox": editorToolbox,
        "trashcan": true,
        "scrollbars": true,
        "grid": {
            "spacing": 20,
            "length": 5,
            "colour": "#dddddd",
            "snap": true,
        },
        "zoom": {
            "controls": true,
            "wheel": true,
        },
    });
    // Load preview
    previewWorkspace = Blockly.inject("preview-workspace", {
        "toolbox": previewToolbox,
        "trashcan": true,
        "scrollbars": true,
        "grid": {
            "spacing": 20,
            "length": 5,
            "colour": "#dddddd",
            "snap": true,
        },
        "zoom": {
            "startScale": 1.5,
            "controls": true,
            "wheel": true,
        },
    });
    output = ace.edit("code-output", {
        "mode": "ace/mode/typescript",
        "readOnly": true
    });
    types.register(editorWorkspace);
    editorWorkspace.addChangeListener(eventHandler);
};
/*
 * Block Definitions
 */
let Builder = BlockTools.Builder;
let FieldAngle = Builder.FieldAngle;
let FieldTextInput = Builder.FieldTextInput;
let FieldDropdown = Builder.FieldDropdown;
//Block Definition
new Builder("builder_block_definition")
    .appendValueInput("name").appendField("Block definition").setCheck("text")
    .setAlign("RIGHT")
    .appendValueInput("inputs").appendField("Input style").setCheck("inputs")
    .setAlign("RIGHT")
    .appendValueInput("hue").appendField("Color").setCheck("hue")
    .setAlign("RIGHT")
    .setColour(240).setNextStatement("field").register();
//Values
new Builder("builder_value_required")
    .appendField("REQUIRED")
    .setColour(0).setOutput().register();
new Builder("builder_value_text")
    .appendField('"').appendField(new FieldTextInput(""), "text").appendField('"')
    .setColour(300).setOutput("text").register();
new Builder("builder_value_inputs")
    .appendField(new FieldDropdown({ "AUTO": "automatic", "INTERNAL": "internal", "EXTERNAL": "external" }), "style")
    .setColour(300).setOutput("inputs").register();
new Builder("builder_value_alignment")
    .appendField(new FieldDropdown({ "LEFT": "left", "CENTRE": "center", "RIGHT": "right" }), "align")
    .setColour(300).setOutput("align").register();
new Builder("builder_value_hue")
    .appendField("hue").appendField(new FieldAngle(0, function (hue) { this.sourceBlock_.setColour(hue); }), "hue")
    .setColour(0).setOutput("hue").register();
//Inputs
new Builder("builder_input_text")
    .appendValueInput("text").appendField("Text").setCheck("text")
    .setColour(180).setBothStatements("field").register();
new Builder("builder_input_input")
    .appendValueInput("name").appendField("Input").setCheck("text")
    .appendValueInput("type").appendField("accepting").setCheck("type")
    .appendValueInput("align").appendField("aligned").setCheck("align")
    .setColour(180).setBothStatements("field").setInputsInline(true).register();
new Builder("builder_input_statement")
    .appendValueInput("name").appendField("Statements").setCheck("text")
    .appendValueInput("type").appendField("accepting").setCheck("type")
    .appendValueInput("align").appendField("aligned").setCheck("align")
    .setColour(180).setBothStatements("field").setInputsInline(true).register();
//Fields (Fun Fact: Made in the editor!)
new BlockTools.Builder("builder_field_text")
    .appendField("Text field")
    .appendValueInput("name").setCheck("string")
    .appendField("defaulting to")
    .appendValueInput("default").setCheck("string")
    .setColour(180).setBothStatements("field").setInputsInline(true).register();
new BlockTools.Builder("builder_field_number")
    .appendField("Number field")
    .appendValueInput("name").setCheck("string")
    .appendField("defaulting to")
    .appendValueInput("default").setCheck("int")
    .setColour(180).setBothStatements("field").setInputsInline(true).register();
//Type
new Builder("builder_type")
    .appendField(new FieldDropdown(...types.getConstructArgs()), "type")
    .setColour(240).setOutput("type").register();
//Connections
new Builder("builder_connections_output")
    .appendValueInput("type").setCheck("type").appendField("Output")
    .setColour(45).setPreviousStatement("field").register();
new Builder("builder_connections_succeeding")
    .appendValueInput("type").setCheck("type").appendField("Succeeding")
    .setColour(45).setPreviousStatement("field").register();
new Builder("builder_connections_preceding")
    .appendValueInput("type").setCheck("type").appendField("Preceding")
    .setColour(45).setPreviousStatement("field").register();
new Builder("builder_connections_both")
    .appendValueInput("preceding").setAlign("RIGHT").setCheck("type")
    .appendField("Preceding")
    .appendValueInput("succeeding").setAlign("RIGHT").setCheck("type")
    .appendField("& Succeeding")
    .setColour(45).setPreviousStatement("field").register();
