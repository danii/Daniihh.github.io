
namespace BlockTools {
  /*
    TTTTT Y   Y PPPP  EEEEE  SSSS
      T    Y Y  P   P E     S    
      T     Y   PPPP  EEE    SSS 
      T     Y   P     E         S
      T     Y   P     EEEEE SSSS 
  */

  /**
   * Blockly Type check.
   */
  export type Type = null | string | string[];

  /**
   * Alignment argument.
   * 
   * @extends AlignmentData
   */
  export type Alignment = "LEFT" | "RIGHT" | "CENTRE" | -1 | 0 | 1;

  /**
   * Alignment data.
   */
  export type AlignmentData = -1 | 0 | 1;

  /**
   * InputStyle data.
   */
  export type InputStyle = boolean | null;

  /**
   * Includes common types for use with the map function and the MapperError
   * class.
   */
  export namespace Map {
    /**
     * The main mapper structure.
     */
    export type Mapper = {
      $main: BlockMapper,
      [key: string]: BlockMapper
    }

    /**
     * Maps specific values of a block to an object using paths (see getValues)
     * or functions.
     */
    export type BlockMapper = {
      $literal_?: any, //Serves as auto completion.
      $lit_?: any, //Serves as auto completion.
      $next?: string | StatementMapper,
      $as?: string,
      $runme?: Runnable,
      [key: string]: string | ValueMapper | BlockMapper | any
    }

    export type Runnable = (this: This) => void;
    export type ValueMapper = (this: This) => string;
    export type StatementMapper = (this: This, block: Blockly.Block) => string;
    export type This = {block: Blockly.Block, scope: any, diagram: any, getValue: (path: string) => string | number | boolean};
  }


  
  /*
    FFFFF U   U N   N  CCCC TTTTT IIIII  OOO  N   N  SSSS
    F     U   U NN  N C       T     I   O   O NN  N S    
    FFF   U   U N N N C       T     I   O   O N N N  SSS 
    F     U   U N  NN C       T     I   O   O N  NN     S
    F      UUU  N   N  CCCC   T   IIIII  OOO  N   N SSSS 
  */

  /**
   * Wraps the given text with xml tags and returns it all as an <xml> element.
   * 
   * @param xml Text to convert to XML.
   * @returns XML Element.
   */
  export let createXml = (xml: string) => Blockly.Xml.textToDom("<xml>" + xml + "</xml>");

  /**
   * Wraps the given text with xml tags and returns it all as a list of XML
   * elements.
   * 
   * @param xml Text to convert to XML.
   * @returns Array of XML elements.
   */
  export let obtainXml = (xml: string) => Array.from(createXml(xml).childNodes).crumble();

  /**
   * Maps out a set of blocks using a mapper.
   * 
   * @param mapper The mapper containing instructions on how to map the blocks.
   * @param block The block at the top of the group to start mapping from.
   * @returns A map of the blocks specified by the mapper.
   */
  export let map = (() => {
    let makeThis = (block: Blockly.Block, scope: Object, diagram: Object): Map.This => ({
      "block": block,
      "scope": scope,
      "diagram": diagram,
      "getValue": (path: string) => BlockTools.getValue(block, path)
    });

    let set = (scope: Object, key: string, value: any) => {
      if (scope[key] instanceof Array) {
        return scope[key][(scope[key] as any[]).push(value) - 1];
      } else {
        scope[key] = value;
        return scope[key];
      }
    };

    let mapField = (key: string, mapper: Map.Mapper, block: Blockly.Block, map: Of<any>, mapScope: Of<any>, blockMapper: Map.BlockMapper) => {
      let value: string | Map.ValueMapper | Map.BlockMapper = blockMapper[key];

      if (value instanceof Object && typeof value != "function") {
        mapScope = set(mapScope, key, {});
        mapBlock(mapper, block, map, mapScope, value);
      } else {
        if (typeof value == "function") value = value.call(makeThis(block, mapScope, map));
        if (typeof value != "string") throw new TypeError('Invalid return value in "' + key + '", expected string, got ' + Object.getType(value) + ".");

        set(mapScope, key, BlockTools.getValue(block, value));
      }
    };

    let mapBlock = (mapper: Map.Mapper, block: Blockly.Block, map?: Of<any>, mapScope?: Of<any>, blockMapper?: Map.BlockMapper) => {
      //If block is an insertion marker, don't even bother.
      if (block.isInsertionMarker()) return;

      //No blockMapper means beginning of map process, start at $main.
      blockMapper = blockMapper || mapper.$main;
      //No map means beginning of map process, start anew.
      map = map || {};
      //No mapScope means beginning of map process, start at root.
      mapScope = mapScope || map;
      //If $as is present, change scope to $as in current scope.
      mapScope = blockMapper.$as ? mapScope = mapScope[blockMapper.$as] = mapScope[blockMapper.$as] || {} : mapScope;

      let nextBlock = block.getNextBlock(); //Next Block
      let prevBlock = block.getPreviousBlock(); //Previous Block (Unused)
      let nextMap = blockMapper.$next; //Next Map Name
      let prevMap = blockMapper.$prev; //Previous Map Name (Unused)

      //Run $runme if present.
      if (blockMapper.$runme) blockMapper.$runme.call(makeThis(block, mapScope, map));

      for (let key in blockMapper) {
        let item = blockMapper[key];
        if (["$next", "$prev", "$as", "$runme"].includes(key)) continue;
        if (["$lit_", "$literal_"].some((start) => key.startsWith(start))) {
          item = key.startsWith("$lit_") && typeof item == "function" ? item.call(makeThis(block, mapScope, map)) : Object.clone(item);
          mapScope[key.substr(key.indexOf("_") + 1)] = item;
          continue;
        }
        if (typeof item == "string" && item.startsWith("$")) {
          mapScope[key] = block.id;
          continue;
        }

        mapField(key, mapper, block, map, mapScope, blockMapper);
      }

      if (nextMap && nextBlock) {
        if (typeof nextMap == "function") nextMap = nextMap.call(makeThis(block, mapScope, map), nextBlock) as string;
        mapBlock(mapper, nextBlock, map, mapScope, mapper[nextMap]);
      }
      return map;
    };

    return mapBlock;
  })();

  /**
   * Includes common types for use with the map function and the MapperError
   * class.
   */
  export namespace Map {
    /**
     * Error thrown when a mapping problem occurs.
     */
    export class MapperError extends AdvancedError {
      public readonly path: string;
      public readonly index: number;
      public readonly type: "field" | "input";

      constructor(type: Error | "field" | "input", index?: number, path?: string) {
        if (type instanceof Error) {
          super("Encountered error while mapping." , type);
        } else {
          let segs = path.split(".");
          let segment = segs[index];
          segs = segs.slice(0, index);
          let reducer = (p: string | number, c) => (typeof p == "string" ? p.length : p) + c.length + 1;
          let len = segs.length == 0 ? 0 : segs.reduce(reducer); len = typeof len == "string" ? len.length + 1 : len;

          super(`No ${type} with the name "${segment}".\n\t\t${path}\n\t\t${" ".repeat(len)}${"~".repeat(segment.length)}`);

          this.path = path;
          this.index = index;
          this.type = type;
        }
      }
    }
  }

  /**
   * It's like using .getInputTargetBlock and .getFieldValue to get a value of
   * a field nested down a few inputs. But that's an object path now.
   * 
   * @example
   *     block.getInputTargetBlock("colour").getFieldValue("r");
   *     //Is equivalent too...
   *     BlockTools.getValue(block, "colour.r");
   * 
   * @param block Block to start from.
   * @param string The path to the field from this block.
   * @returns The value of the field, parsed into a proper type.
   */
  export let getValue = (block: Blockly.Block, path: string): string | number | boolean => {
    let parse = (item: string): string | number | boolean =>
      ({"false": false, "true": true}[item.toLowerCase()] != undefined ?
      {"false": false, "true": true}[item.toLowerCase()] :
      (!isNaN(parseInt(item)) ?
        parseInt(item) :
        item));
    
    let field: Blockly.Block | string = block;
    let segments = path.split(".");

    for (let index = 0; index < segments.length; index++) {
      field = field as Blockly.Block;
      let segment = segments[index];

      if (field.getInput(segment) == null && index != segments.length - 1) {
        throw new Map.MapperError("input", index, path);
      } else if (field.getField(segment) == null && index == segments.length - 1) {
        throw new Map.MapperError("field", index, path);
      }
      
      field = index == segments.length - 1 ? field.getFieldValue(segment) : field.getInputTargetBlock(segment);
      if (field == null) return undefined;
    }

    return parse(field as string);
  }


  /*
     CCCC L      AAA   SSSS  SSSS EEEEE  SSSS
    C     L     A   A S     S     E     S    
    C     L     AAAAA  SSS   SSS  EEE    SSS 
    C     L     A   A     S     S E         S
     CCCC LLLLL A   A SSSS  SSSS  EEEEE SSSS
  */

  export class CodeGenerator {
    private mapper: Map.Mapper;
    private blockType: string | ((blocks: Blockly.Block[]) => Blockly.Block[]);
    public generators: Of<CodeGenerator.Generator> = {};

    public constructor(mapper: Map.Mapper, blockType: string | ((blocks: Blockly.Block[]) => Blockly.Block[])) {
      this.mapper = mapper;
      this.blockType = blockType;
    }

    public generate(workspace: Blockly.WorkspaceSvg, generator: string | (CodeGenerator.Generator)): (Code | CodeGenerator.GeneratorError)[] {
      let blocks: Blockly.Block[] = workspace.getAllBlocks();
      if (typeof this.blockType == "string") {
        blocks = blocks.filter((block) => block.type == this.blockType);
      } else {
        let workspaceBlocks = blocks;
        blocks = this.blockType(blocks);
        blocks = blocks.filter((block) => workspaceBlocks.includes(block));
      }

      let timer = {
        time(timer: Key) {
          if (!this[timer]) this[timer] = performance.now();
          else this[timer] = (performance.now() - this[timer]) / 1000;
        }
      }

      timer.time("mapping");
      let maps = blocks.map((block) => [block.id, (() => {
        try {return BlockTools.map(this.mapper, block);}
        catch (error) {return new CodeGenerator.GeneratorError("Map process failed.", error);}
      })()]) as Entry<Of<any> | CodeGenerator.GeneratorError>[];
      timer.time("mapping");

      let shared = {};
      if (typeof generator == "string") generator = this.generators[generator];

      let code = maps.map(([id, map]) => {
        if (map instanceof CodeGenerator.GeneratorError) return map;
        
        let code: Code | CodeGenerator.GeneratorError;
        timer.time(id);
        try {code = (generator as (valueMap: Of<any>, shared?: any) => Code)(map, shared);}
        catch (error) {code = new CodeGenerator.GeneratorError("Compile process failed.", error);}
        if (code instanceof CodeGenerator.GeneratorError) timer[id] = null;
        else timer.time(id);

        return code;
      }) as (CodeGenerator.GeneratorError | Code)[];

      console.debug("Generator Timing Object (In Seconds):", timer);
      return code;
    }

    public addGenerator(generator: CodeGenerator.Generator, name: string) {
      this.generators[name] = generator;
    }
  }

  export namespace CodeGenerator {
    export type Generator = (valueMap: Of<any>, shared?: any) => Code;
    export class GeneratorError extends AdvancedError {};
  }

  /**
   * @deprecated Unnecessary class.
   */
  export class Code {
    private shown = "";
    private used = "";
    private problems: AdvancedError[] = [];

    public append(...code: (string | [string, string] | Code)[]) {
      for (let piece of code) {
        if (piece instanceof Array) {
          if (piece[0]) this.shown += piece[0];
          if (piece[1]) this.used += piece[1];
        } else if (piece instanceof Code) {
          this.shown += piece.getShown();
          this.used += piece.getUsed();
          this.problems.push(...piece.getProblems());
        } else {
          this.shown += piece;
          this.used += piece;
        }
      }
      return this;
    }

    public ifOver(count: number, ...code: (string | [string, string] | Code)[]) {
      let shownOver = this.shown.length - this.shown.lastIndexOf("\n") >= count;
      let usedOver = this.used.length - this.used.lastIndexOf("\n") >= count;

      if (shownOver) this.shown += "\n";
      if (usedOver) this.used += "\n";
      for (let piece of code) {
        if (piece instanceof Array) {
          if (shownOver && piece[0]) this.shown += piece[0];
          if (usedOver && piece[1]) this.used += piece[1];
        } else if (piece instanceof Code) {
          if (shownOver) this.shown += piece.getShown();
          if (usedOver) this.used += piece.getUsed();
        } else {
          if (shownOver) this.shown += piece;
          if (usedOver) this.used += piece;
        }
      }
      return this;
    }

    public pushProblem(error: AdvancedError) {
      this.problems.push(error);
      return this;
    }

    public getShown() {
      return this.shown;
    }

    public getUsed() {
      return this.used;
    }

    public getProblems() {
      return this.problems;
    }
  }

  /**
   * A class that offers similar functionality to Blockly's variables,
   * but as an array of values rather than a map of variables.
   */
  export class Types {
    private table: Of<string> = {};
  
    /**
     * Like the @bounded decorator, but when you actually want the value that
     * this was assigned too.
     * 
     * @param func Function to use this with, old value passed as first argument
     *   followed by the rest.
     */
    private divert(func: (this: this, ...rest: any[]) => any) {
      let thisHere = this;
      return function(...args) {
        args.unshift(this);
        return func.apply(thisHere, args);
      };
    }
  
    /**
     * A function that generates options for a dropdown menu in a Type block.
     * This method was built with it being a value for Blockly.Dropdown's
     * generator function rather than being invoked.
     * 
     * @example //Using BlockTools.Builder
     *     new BlockTools.Builder.FieldDropdown(types.updateDropdown);
     * @example //Using Blockly
     *     new Blockly.FieldDropdown(values.updateDropdown);
     * 
     * @param dropdown The dropdown block the values are being generated for.
     * @returns The new values to show.
     */
    public updateDropdown = this.divert(function(this: Types, dropdown: Blockly.FieldDropdown): Entry<string>[] {
      let data = Object.entries(this.table).map((a) => a.reverse()) as Entry<string>[];
      let options = dropdown && dropdown.getValue() != "-1" ? [["Delete Type...", "-3"]] as Entry<string>[] : [];
      return [["Anything", "-1"], ...data, ["Create Type...", "-2"], ...options];
    });
  
    /**
     * A function that validates options for a dropdown menu in a Type block.
     * Typically just to add functionality to the Create & Delete type buttons.
     * This method was built with it being a value for Blockly.Dropdown's
     * generator function rather than being invoked.
     * 
     * @example //Using BlockTools.Builder
     *     new BlockTools.Builder.FieldDropdown(types.updateDropdown, types.validateDropdown);
     * @example //Using Blockly
     *     new Blockly.FieldDropdown(values.updateDropdown, types.validateDropdown);
     * 
     * @param dropdown The dropdown block the values are being generated for.
     * @returns The new value to show or null.
     */
    public validateDropdown = this.divert(function(this: Types, dropdown: Blockly.FieldDropdown, option: string) {
      let switchObj = {
        "-2": () => this.createType() || null,
        "-3": () => this.deleteType(dropdown.sourceBlock_.workspace, dropdown.getValue())
      }
  
      let result = switchObj[option] ? switchObj[option]() : undefined;
      return result;
    });
  
    /**
     * Accompanied by the spread operator, used as a shortcut for specifying
     * both updateDropdown and validateDropdown for FieldDropdown constructors.
     * 
     * @example //Using BlockTools.Builder
     *     new BlockTools.Builder.FieldDropdown(...types.getConstructArgs());
     * @example //Using Blockly
     *     new Blockly.FieldDropdown(...value.getConstructArgs());
     * 
     * @returns Both the .updateDropdown and .validateDropdown functions.
     */
    public getConstructArgs(): [() => Entry<string>[], (option: string) => void] {
      return [this.updateDropdown, this.validateDropdown];
    }

    @bounded
    public buildToolbox(this: Types) {
      let obtainButton = (text: string, key: string) =>
          obtainXml('<button text="' + text + '" callbackKey="' + key + '"/>');
  
      let xmlStart = '<block type="builder_type"><field name="type">';
      let xmlEnd = "</field></block>";
      let list = [obtainButton("Create Type...", "createType")];
      if (Object.keys(this.table).length != 0) {
        list.push(obtainButton("Delete Type...", "deleteType"));
      }
  
      list.push(obtainXml([xmlStart, "-1", xmlEnd].join("")));
  
      for (let type in this.table) {
        list.push(obtainXml([xmlStart, type, xmlEnd].join("")));
      }
      return list;
    }
    
    @bounded
    public createType(this: Types, button?: Blockly.FlyoutButton): string | void {
      let name = prompt("Enter the name of the type to create...");
      if ([null, ""].includes(name)) return;
  
      if (Object.values(this.table).includes(name)) return alert('A type already exists with the name "' + name + '".');
      let position = Math.max(-1, ...Object.keys(this.table).map((int) => parseInt(int))) + 1;
      this.table[position] = name;
  
      if (button) button.getTargetWorkspace().getToolbox().refreshSelection();
      return position.toString();
    }
  
    @bounded
    public deleteType(this: Types, argument: Blockly.FlyoutButton | Blockly.Workspace, item?: string, confirmm?: boolean): boolean {
      if (argument instanceof Blockly.Workspace) {
        if (!Object.keys(this.table).includes(item)) return false;
  
        if (!confirmm) {
          confirmm = confirm('Are you sure you want to delete the type "' + this.table[item] + '"?');
          if (!confirmm) return false;
        }
  
        let [id] = Object.entries(this.table).find(([key]) => key == item);
        delete this.table[id as Exclude<Key, symbol>];
  
        for (let block of argument.getAllBlocks()) {
          if (block.type != "builder_type") continue;
          if (block.getField("type").getValue() == id) (block as Blockly.BlockSvg).dispose(false, true);
        }
        return true;
      }
  
      let recent = this.table[Math.max(...Object.keys(this.table).map((a) => parseInt(a)))];
      item = prompt("Enter the name of the type to delete...", recent);
      if ([null, ""].includes(item)) return false;
      item = Object.fromEntries(Object.entries(this.table).map((a) => a.reverse()))[item];
  
      if (this.deleteType(argument.getTargetWorkspace(), item, true)) {
        argument.getTargetWorkspace().getToolbox().refreshSelection();
        return true;
      }
      alert('No type exists with the name "' + item + '".');
      return false;
    }
  
    /**
     * Registers all the button callbacks and category callbacks required
     * effectively use this class.
     * 
     * @param workspace Workspace to register everything too.
     */
    public register(workspace: Blockly.WorkspaceSvg) {
      workspace.registerToolboxCategoryCallback("TYPES", this.buildToolbox);
  
      workspace.registerButtonCallback("createType", this.createType);
      workspace.registerButtonCallback("deleteType", this.deleteType);
    }
  
    /**
     * Returns the name of the type number.
     * 
     * @param value Number of the type as a string.
     * @returns The name of the type or null if no type with that number exists.
     */
    public toType(value: string): string {
      return value == "-1" ? null : this.table[value];
    }
  }

  export class Builder {
    private name: string;
    private colour: number = null;
    private inputStyle: InputStyle = null;
    private hat: string = undefined;
  
    private inputs: Builder.Input[] = [];
    private output: Type = undefined;
    private previous: Type = undefined;
    private next: Type = undefined;
  
    /**
     * Creates a new block builder used to make Blockly blocks.
     * 
     * @param name Internal code name of this block.
     */
    public constructor(name: string) {
      this.name = name;
    }
  
    /**
     * Appends a new ValueInput to this block.
     * 
     * @param name Internal code name of this input.
     * @returns This, for chaining.
     */
    public appendValueInput(name: string): this {
      this.inputs.push(new Builder.ValueInput(name));
      return this;
    }
  
    /**
     * Appends a new StatementInput to this block.
     * 
     * @param name Internal code name of this input.
     * @returns This, for chaining.
     */
    public appendStatementInput(name: string): this {
      this.inputs.push(new Builder.StatementInput(name));
      return this;
    }
  
    /**
     * Appends a new DummyInput to this block.
     * 
     * @returns This, for chaining.
     */
    public appendDummyInput(): this {
      this.inputs.push(new Builder.DummyInput());
      return this;
    }
  
    /**
     * Returns the newest input appended to this block.
     * If no inputs exist yet, a DummyInput will be created.
     * 
     * @returns The newest input, otherwise a new DummyInput.
     */
    public getLastInput(): Builder.Input {
      if (this.inputs.length == 0) this.appendDummyInput();
      return this.inputs.last;
    }
  
    /**
     * Gets the newest input appended to this block and runs
     * appendField on it.
     * 
     * Description From {@link Builder.Input#appendField}
     * 
     * Appends raw text or a field with a name to this input.
     * The name field is unnecessarry when appending text.
     * 
     * @param field Text / Field to add.
     * @param name Name of the field to add.
     * @returns This, for chaining.
     * 
     * @see Builder.Input.appendField
     */
    public appendField(field: string | Builder.Field<any>, name?: string): this {
      this.getLastInput().appendField(field, name);
      return this;
    }
  
    /**
     * Gets the newest input appended to this block and runs
     * setAlign on it.
     * 
     * Description From {@link Builder.Input#setAlign}
     * 
     * Sets the alignment of the text within this field.
     * 
     * @param alignment Alignment.
     * @returns This, for chaining.
     */
    public setAlign(alignment: Alignment): this {
      this.getLastInput().setAlign(alignment);
      return this;
    }
  
    /**
     * Gets the newest input appended to this block and runs
     * setCheck on it. The newest input must not be a DummyInput!
     * 
     * Description From {@link Builder.TypedInput#setCheck}
     * 
     * Sets the types of inputs this input can accept.
     * Automatically compacts the provided type input.
     * 
     * @example //Accepting booleans and numbers:
     *     input.setCheck('boolean', 'number');
     *     input.acceptingType //['boolean', 'number']
     * @example //Using an array:
     *     input.setCheck(['trait', 'smell', ...extras]);
     *     input.acceptingType //['trait', 'smell', 'taste']
     * 
     * @throws TypeError if the newest input was a DummyInput.
     * @param type Type(s) or Array(s) of Type(s) to use.
     * @returns This, for chaining.
     */
    public setCheck(...type: Type[]): this {
      let input = this.getLastInput();
      if (!(input instanceof Builder.TypedInput))
        throw new TypeError("The last input provided is not a TypedInput.");
      
      input.setCheck(type as Type);
      return this;
    }
  
    public setOutput(...check: Type[] | [boolean, ...Type[]]): this {
      if (typeof check[0] == "boolean") if (!check.shift()) return this;
      this.output = (check as Type[]).crumbleFlat() as Type;
      return this;
    }
  
    public setPreviousStatement(...check: Type[] | [boolean, ...Type[]]): this {
      if (typeof check[0] == "boolean") if (!check.shift()) return this;
      this.previous = (check as Type[]).crumbleFlat() as Type;
      return this;
    }
  
    public setNextStatement(...check: Type[] | [boolean, ...Type[]]): this {
      if (typeof check[0] == "boolean") if (!check.shift()) return this;
      this.next = (check as Type[]).crumbleFlat() as Type;
      return this;
    }
  
    public setBothStatements(...check: Type[] | [boolean, ...Type[]]): this {
      if (typeof check[0] == "boolean") if (!check.shift()) return this;
      this.next = (check as Type[]).crumbleFlat() as Type;
      this.previous = this.next;
      return this;
    }

    public setHat(hat: boolean): this {
      this.hat = hat ? "cap" : undefined;
      return this;
    }
  
    public setInputsInline(inputStyle: InputStyle): this {
      this.inputStyle = inputStyle;
      return this;
    }
  
    public setColour(colour: number): this {
      this.colour = colour;
      return this;
    }
  
    public build(): {init: (this: Blockly.Block) => void} {
      let builder = this;
  
      let initFunc = function(this: Blockly.Block) {
        for (let builtInput of builder.inputs) {
          let name = { //Class names like to get mangled in compression.
            [Builder.DummyInput.name]: "DummyInput",
            [Builder.StatementInput.name]: "StatementInput",
            [Builder.ValueInput.name]: "ValueInput"
          }[builtInput.constructor.name];

          let typedInput = builtInput instanceof Builder.TypedInput ? builtInput : null;
          let input = this["append" + name](typedInput && typedInput.name);

          input.setAlign(builtInput.alignment);
          if (typedInput) input.setCheck(typedInput.acceptingType);
          for (let field of builtInput.fields) {
            if (typeof field == "string") {input.appendField(field); continue;}

            let name = { //Class names like to get mangled in compression.
              [Builder.FieldAngle.name]: "FieldAngle",
              [Builder.FieldDropdown.name]: "FieldDropdown",
              [Builder.FieldTextInput.name]: "FieldTextInput"
            }[field.constructor.name];

            input.appendField(new Blockly[name](...field.getArguments()), field.name);
          }
        }
  
        this.setOutput(builder.output !== undefined, builder.output);
        this.setPreviousStatement(builder.previous !== undefined, builder.previous);
        this.setNextStatement(builder.next !== undefined, builder.next);
  
        this.setInputsInline(builder.inputStyle);
        this.setColour(builder.colour);
        this.hat = builder.hat;
      }
  
      return {"init": initFunc};
    }
  
    public register() {
      Blockly.Blocks[this.name] = this.build();
    }
  }

  export namespace Builder {
    export class Input {
      public fields: (Builder.Field<any> | string)[] = [];
      public alignment: AlignmentData = -1;
  
      /**
       * Appends raw text or a field with a name to this input.
       * The name field is unnecessarry when appending text.
       * 
       * @param field Text / Field to add.
       * @param name Name of the field to add.
       */
      public appendField(field: string | Builder.Field<any>, name?: string) {
        if (typeof field == "string") return this.fields.push(field);
        
        field.name = name;
        this.fields.push(field);
      }
  
      /**
       * Sets the alignment of the text within this field.
       * 
       * @param alignment Alignment.
       */
      public setAlign(alignment: Alignment) {
        let convert = {
          "LEFT": -1,
          "CENTRE": 0,
          "RIGHT": 1,
        };
  
        this.alignment = convert[alignment] != null ? convert[alignment] : alignment;
      }
    }
  
    export class TypedInput extends Builder.Input {
      public name: string;
      public acceptingType: Type;
  
      public constructor(name: string) {
        super();
        
        this.name = name;
      }
  
      /**
       * Sets the types of inputs this input can accept.
       * Automatically compacts the provided type input.
       * 
       * @example //Accepting booleans and numbers:
       *     input.setCheck('boolean', 'number');
       *     input.acceptingType //['boolean', 'number']
       * @example //Using an array:
       *     input.setCheck(['trait', 'smell', ...extras]);
       *     input.acceptingType //['trait', 'smell', 'taste']
       * 
       * @throws TypeError if the newest input was a DummyInput.
       * @param type Type(s) or Array(s) of Type(s) to use.
       */
      public setCheck(...type: Type[]) {
        this.acceptingType = type.crumbleFlat() as Type;
      }
    }
  
    export class ValueInput extends Builder.TypedInput {}
  
    export class StatementInput extends Builder.TypedInput {}
  
    export class DummyInput extends Builder.Input {}
  
    export class Field<Contents, Validator = Contents> {
      public name: string;
      protected value: Contents;
      protected validator: (this: Blockly.Field, value: Validator) => Validator | void;
  
      public constructor(value: Contents, validator?: (this: Blockly.Field, value: Validator) => Validator | void) {
        this.value = value;
        this.validator = validator;
      }
  
      public getArguments(): any[] {
        return [this.value, this.validator];
      }
    }
  
    export class FieldAngle extends Builder.Field<number> {}
  
    export class FieldTextInput extends Builder.Field<string> {}
  
    export class FieldDropdown extends Builder.Field<((this: FieldDropdown) =>
        Entry<string>[]) | Entry<string>, string> {
      public constructor(options: ((this: FieldDropdown) => Of<string> |
          Entry<string>[]) | Of<string> | Entry<string>[],
          validator?: (this: Blockly.Field, value: string) => string | void) {
        if (!(options instanceof Array) && typeof options != "function") {
          options = Object.entries(options).map(([k, v]) => [v, k] as Pair<string, string>);
        } else if (typeof options == "function") {
          let generator = options;
          options = function(...args) {
            let output = generator.apply(this, args);
            return !(output instanceof Array) ?
                Object.entries(output).map(([k, v]) => [v, k] as Entry<string>)
                : output;
          }
        }
  
        super(options as ((this: FieldDropdown) => Entry<string>[]) | Entry<string>, validator);
      }
  
      public getArguments(): any[] {
        return [this.value, this.validator];
      }
    }
  }
}
