function _decorate(decorators, factory, superClass, mixins) { var api = _getDecoratorsApi(); if (mixins) { for (var i = 0; i < mixins.length; i++) { api = mixins[i](api); } } var r = factory(function initialize(O) { api.initializeInstanceElements(O, decorated.elements); }, superClass); var decorated = api.decorateClass(_coalesceClassElements(r.d.map(_createElementDescriptor)), decorators); api.initializeClassElements(r.F, decorated.elements); return api.runClassFinishers(r.F, decorated.finishers); }

function _getDecoratorsApi() { _getDecoratorsApi = function () { return api; }; var api = { elementsDefinitionOrder: [["method"], ["field"]], initializeInstanceElements: function (O, elements) { ["method", "field"].forEach(function (kind) { elements.forEach(function (element) { if (element.kind === kind && element.placement === "own") { this.defineClassElement(O, element); } }, this); }, this); }, initializeClassElements: function (F, elements) { var proto = F.prototype; ["method", "field"].forEach(function (kind) { elements.forEach(function (element) { var placement = element.placement; if (element.kind === kind && (placement === "static" || placement === "prototype")) { var receiver = placement === "static" ? F : proto; this.defineClassElement(receiver, element); } }, this); }, this); }, defineClassElement: function (receiver, element) { var descriptor = element.descriptor; if (element.kind === "field") { var initializer = element.initializer; descriptor = { enumerable: descriptor.enumerable, writable: descriptor.writable, configurable: descriptor.configurable, value: initializer === void 0 ? void 0 : initializer.call(receiver) }; } Object.defineProperty(receiver, element.key, descriptor); }, decorateClass: function (elements, decorators) { var newElements = []; var finishers = []; var placements = { static: [], prototype: [], own: [] }; elements.forEach(function (element) { this.addElementPlacement(element, placements); }, this); elements.forEach(function (element) { if (!_hasDecorators(element)) return newElements.push(element); var elementFinishersExtras = this.decorateElement(element, placements); newElements.push(elementFinishersExtras.element); newElements.push.apply(newElements, elementFinishersExtras.extras); finishers.push.apply(finishers, elementFinishersExtras.finishers); }, this); if (!decorators) { return { elements: newElements, finishers: finishers }; } var result = this.decorateConstructor(newElements, decorators); finishers.push.apply(finishers, result.finishers); result.finishers = finishers; return result; }, addElementPlacement: function (element, placements, silent) { var keys = placements[element.placement]; if (!silent && keys.indexOf(element.key) !== -1) { throw new TypeError("Duplicated element (" + element.key + ")"); } keys.push(element.key); }, decorateElement: function (element, placements) { var extras = []; var finishers = []; for (var decorators = element.decorators, i = decorators.length - 1; i >= 0; i--) { var keys = placements[element.placement]; keys.splice(keys.indexOf(element.key), 1); var elementObject = this.fromElementDescriptor(element); var elementFinisherExtras = this.toElementFinisherExtras((0, decorators[i])(elementObject) || elementObject); element = elementFinisherExtras.element; this.addElementPlacement(element, placements); if (elementFinisherExtras.finisher) { finishers.push(elementFinisherExtras.finisher); } var newExtras = elementFinisherExtras.extras; if (newExtras) { for (var j = 0; j < newExtras.length; j++) { this.addElementPlacement(newExtras[j], placements); } extras.push.apply(extras, newExtras); } } return { element: element, finishers: finishers, extras: extras }; }, decorateConstructor: function (elements, decorators) { var finishers = []; for (var i = decorators.length - 1; i >= 0; i--) { var obj = this.fromClassDescriptor(elements); var elementsAndFinisher = this.toClassDescriptor((0, decorators[i])(obj) || obj); if (elementsAndFinisher.finisher !== undefined) { finishers.push(elementsAndFinisher.finisher); } if (elementsAndFinisher.elements !== undefined) { elements = elementsAndFinisher.elements; for (var j = 0; j < elements.length - 1; j++) { for (var k = j + 1; k < elements.length; k++) { if (elements[j].key === elements[k].key && elements[j].placement === elements[k].placement) { throw new TypeError("Duplicated element (" + elements[j].key + ")"); } } } } } return { elements: elements, finishers: finishers }; }, fromElementDescriptor: function (element) { var obj = { kind: element.kind, key: element.key, placement: element.placement, descriptor: element.descriptor }; var desc = { value: "Descriptor", configurable: true }; Object.defineProperty(obj, Symbol.toStringTag, desc); if (element.kind === "field") obj.initializer = element.initializer; return obj; }, toElementDescriptors: function (elementObjects) { if (elementObjects === undefined) return; return _toArray(elementObjects).map(function (elementObject) { var element = this.toElementDescriptor(elementObject); this.disallowProperty(elementObject, "finisher", "An element descriptor"); this.disallowProperty(elementObject, "extras", "An element descriptor"); return element; }, this); }, toElementDescriptor: function (elementObject) { var kind = String(elementObject.kind); if (kind !== "method" && kind !== "field") { throw new TypeError('An element descriptor\'s .kind property must be either "method" or' + ' "field", but a decorator created an element descriptor with' + ' .kind "' + kind + '"'); } var key = _toPropertyKey(elementObject.key); var placement = String(elementObject.placement); if (placement !== "static" && placement !== "prototype" && placement !== "own") { throw new TypeError('An element descriptor\'s .placement property must be one of "static",' + ' "prototype" or "own", but a decorator created an element descriptor' + ' with .placement "' + placement + '"'); } var descriptor = elementObject.descriptor; this.disallowProperty(elementObject, "elements", "An element descriptor"); var element = { kind: kind, key: key, placement: placement, descriptor: Object.assign({}, descriptor) }; if (kind !== "field") { this.disallowProperty(elementObject, "initializer", "A method descriptor"); } else { this.disallowProperty(descriptor, "get", "The property descriptor of a field descriptor"); this.disallowProperty(descriptor, "set", "The property descriptor of a field descriptor"); this.disallowProperty(descriptor, "value", "The property descriptor of a field descriptor"); element.initializer = elementObject.initializer; } return element; }, toElementFinisherExtras: function (elementObject) { var element = this.toElementDescriptor(elementObject); var finisher = _optionalCallableProperty(elementObject, "finisher"); var extras = this.toElementDescriptors(elementObject.extras); return { element: element, finisher: finisher, extras: extras }; }, fromClassDescriptor: function (elements) { var obj = { kind: "class", elements: elements.map(this.fromElementDescriptor, this) }; var desc = { value: "Descriptor", configurable: true }; Object.defineProperty(obj, Symbol.toStringTag, desc); return obj; }, toClassDescriptor: function (obj) { var kind = String(obj.kind); if (kind !== "class") { throw new TypeError('A class descriptor\'s .kind property must be "class", but a decorator' + ' created a class descriptor with .kind "' + kind + '"'); } this.disallowProperty(obj, "key", "A class descriptor"); this.disallowProperty(obj, "placement", "A class descriptor"); this.disallowProperty(obj, "descriptor", "A class descriptor"); this.disallowProperty(obj, "initializer", "A class descriptor"); this.disallowProperty(obj, "extras", "A class descriptor"); var finisher = _optionalCallableProperty(obj, "finisher"); var elements = this.toElementDescriptors(obj.elements); return { elements: elements, finisher: finisher }; }, runClassFinishers: function (constructor, finishers) { for (var i = 0; i < finishers.length; i++) { var newConstructor = (0, finishers[i])(constructor); if (newConstructor !== undefined) { if (typeof newConstructor !== "function") { throw new TypeError("Finishers must return a constructor."); } constructor = newConstructor; } } return constructor; }, disallowProperty: function (obj, name, objectType) { if (obj[name] !== undefined) { throw new TypeError(objectType + " can't have a ." + name + " property."); } } }; return api; }

function _createElementDescriptor(def) { var key = _toPropertyKey(def.key); var descriptor; if (def.kind === "method") { descriptor = { value: def.value, writable: true, configurable: true, enumerable: false }; } else if (def.kind === "get") { descriptor = { get: def.value, configurable: true, enumerable: false }; } else if (def.kind === "set") { descriptor = { set: def.value, configurable: true, enumerable: false }; } else if (def.kind === "field") { descriptor = { configurable: true, writable: true, enumerable: true }; } var element = { kind: def.kind === "field" ? "field" : "method", key: key, placement: def.static ? "static" : def.kind === "field" ? "own" : "prototype", descriptor: descriptor }; if (def.decorators) element.decorators = def.decorators; if (def.kind === "field") element.initializer = def.value; return element; }

function _coalesceGetterSetter(element, other) { if (element.descriptor.get !== undefined) { other.descriptor.get = element.descriptor.get; } else { other.descriptor.set = element.descriptor.set; } }

function _coalesceClassElements(elements) { var newElements = []; var isSameElement = function (other) { return other.kind === "method" && other.key === element.key && other.placement === element.placement; }; for (var i = 0; i < elements.length; i++) { var element = elements[i]; var other; if (element.kind === "method" && (other = newElements.find(isSameElement))) { if (_isDataDescriptor(element.descriptor) || _isDataDescriptor(other.descriptor)) { if (_hasDecorators(element) || _hasDecorators(other)) { throw new ReferenceError("Duplicated methods (" + element.key + ") can't be decorated."); } other.descriptor = element.descriptor; } else { if (_hasDecorators(element)) { if (_hasDecorators(other)) { throw new ReferenceError("Decorators can't be placed on different accessors with for " + "the same property (" + element.key + ")."); } other.decorators = element.decorators; } _coalesceGetterSetter(element, other); } } else { newElements.push(element); } } return newElements; }

function _hasDecorators(element) { return element.decorators && element.decorators.length; }

function _isDataDescriptor(desc) { return desc !== undefined && !(desc.value === undefined && desc.writable === undefined); }

function _optionalCallableProperty(obj, name) { var value = obj[name]; if (value !== undefined && typeof value !== "function") { throw new TypeError("Expected '" + name + "' to be a function"); } return value; }

function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }

function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

let BlockTools;

(function (_BlockTools) {
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

  /**
   * Alignment argument.
   * 
   * @extends AlignmentData
   */

  /**
   * Alignment data.
   */

  /**
   * InputStyle data.
   */
  let Map;

  (function (_Map) {})(Map || (Map = _BlockTools.Map || (_BlockTools.Map = {})));

  const createXml = _BlockTools.createXml = xml => Blockly.Xml.textToDom("<xml>" + xml + "</xml>");

  const obtainXml = _BlockTools.obtainXml = xml => Array.from(createXml(xml).childNodes).crumble();

  const map = _BlockTools.map = (() => {
    let makeThis = (block, scope, diagram) => ({
      "block": block,
      "scope": scope,
      "diagram": diagram,
      "getValue": path => BlockTools.getValue(block, path)
    });

    let set = (scope, key, value) => {
      if (scope[key] instanceof Array) {
        return scope[key][scope[key].push(value) - 1];
      } else {
        scope[key] = value;
        return scope[key];
      }
    };

    let mapField = (key, mapper, block, map, mapScope, blockMapper) => {
      let value = blockMapper[key];

      if (value instanceof Object && typeof value != "function") {
        mapScope = set(mapScope, key, {});
        mapBlock(mapper, block, map, mapScope, value);
      } else {
        if (typeof value == "function") value = value.call(makeThis(block, mapScope, map));
        if (typeof value != "string") throw new TypeError('Invalid return value in "' + key + '", expected string, got ' + Object.getType(value) + ".");
        set(mapScope, key, BlockTools.getValue(block, value));
      }
    };

    let mapBlock = (mapper, block, map, mapScope, blockMapper) => {
      //If block is an insertion marker, don't even bother.
      if (block.isInsertionMarker()) return; //No blockMapper means beginning of map process, start at $main.

      blockMapper = blockMapper || mapper.$main; //No map means beginning of map process, start anew.

      map = map || {}; //No mapScope means beginning of map process, start at root.

      mapScope = mapScope || map; //If $as is present, change scope to $as in current scope.

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

        if (["$lit_", "$literal_"].some(start => key.startsWith(start))) {
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
        if (typeof nextMap == "function") nextMap = nextMap.call(makeThis(block, mapScope, map), nextBlock);
        mapBlock(mapper, nextBlock, map, mapScope, mapper[nextMap]);
      }

      return map;
    };

    return mapBlock;
  })();

  (function (_Map2) {
    class MapperError extends AdvancedError {
      constructor(type, index, path) {
        if (type instanceof Error) {
          super("Encountered error while mapping.", type);

          _defineProperty(this, "path", void 0);

          _defineProperty(this, "index", void 0);

          _defineProperty(this, "type", void 0);
        } else {
          let segs = path.split(".");
          let segment = segs[index];
          segs = segs.slice(0, index);

          let reducer = (p, c) => (typeof p == "string" ? p.length : p) + c.length + 1;

          let len = segs.length == 0 ? 0 : segs.reduce(reducer);
          len = typeof len == "string" ? len.length + 1 : len;
          super(`No ${type} with the name "${segment}".\n\t\t${path}\n\t\t${" ".repeat(len)}${"~".repeat(segment.length)}`);

          _defineProperty(this, "path", void 0);

          _defineProperty(this, "index", void 0);

          _defineProperty(this, "type", void 0);

          this.path = path;
          this.index = index;
          this.type = type;
        }
      }

    }

    _Map2.MapperError = MapperError;
  })(Map || (Map = _BlockTools.Map || (_BlockTools.Map = {})));

  const getValue = _BlockTools.getValue = (block, path) => {
    let parse = item => ({
      "false": false,
      "true": true
    })[item.toLowerCase()] != undefined ? {
      "false": false,
      "true": true
    }[item.toLowerCase()] : !isNaN(parseInt(item)) ? parseInt(item) : item;

    let field = block;
    let segments = path.split(".");

    for (let index = 0; index < segments.length; index++) {
      field = field;
      let segment = segments[index];

      if (field.getInput(segment) == null && index != segments.length - 1) {
        throw new Map.MapperError("input", index, path);
      } else if (field.getField(segment) == null && index == segments.length - 1) {
        throw new Map.MapperError("field", index, path);
      }

      field = index == segments.length - 1 ? field.getFieldValue(segment) : field.getInputTargetBlock(segment);
      if (field == null) return undefined;
    }

    return parse(field);
  };

  class CodeGenerator {
    constructor(mapper, blockType) {
      _defineProperty(this, "mapper", void 0);

      _defineProperty(this, "blockType", void 0);

      _defineProperty(this, "generators", {});

      this.mapper = mapper;
      this.blockType = blockType;
    }

    generate(workspace, generator) {
      let blocks = workspace.getAllBlocks();

      if (typeof this.blockType == "string") {
        blocks = blocks.filter(block => block.type == this.blockType);
      } else {
        let workspaceBlocks = blocks;
        blocks = this.blockType(blocks);
        blocks = blocks.filter(block => workspaceBlocks.includes(block));
      }

      let timer = {
        time(timer) {
          if (!this[timer]) this[timer] = performance.now();else this[timer] = (performance.now() - this[timer]) / 1000;
        }

      };
      timer.time("mapping");
      let maps = blocks.map(block => [block.id, (() => {
        try {
          return BlockTools.map(this.mapper, block);
        } catch (error) {
          return new CodeGenerator.GeneratorError("Map process failed.", error);
        }
      })()]);
      timer.time("mapping");
      let shared = {};
      if (typeof generator == "string") generator = this.generators[generator];
      let code = maps.map(([id, map]) => {
        if (map instanceof CodeGenerator.GeneratorError) return map;
        let code;
        timer.time(id);

        try {
          code = generator(map, shared);
        } catch (error) {
          code = new CodeGenerator.GeneratorError("Compile process failed.", error);
        }

        if (code instanceof CodeGenerator.GeneratorError) timer[id] = null;else timer.time(id);
        return code;
      });
      console.debug("Generator Timing Object (In Seconds):", timer);
      return code;
    }

    addGenerator(generator, name) {
      this.generators[name] = generator;
    }

  }

  _BlockTools.CodeGenerator = CodeGenerator;

  (function (_CodeGenerator) {
    class GeneratorError extends AdvancedError {}

    _CodeGenerator.GeneratorError = GeneratorError;
    ;
  })(CodeGenerator || (CodeGenerator = _BlockTools.CodeGenerator || (_BlockTools.CodeGenerator = {})));

  class Code {
    constructor() {
      _defineProperty(this, "shown", "");

      _defineProperty(this, "used", "");

      _defineProperty(this, "problems", []);
    }

    append(...code) {
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

    ifOver(count, ...code) {
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

    pushProblem(error) {
      this.problems.push(error);
      return this;
    }

    getShown() {
      return this.shown;
    }

    getUsed() {
      return this.used;
    }

    getProblems() {
      return this.problems;
    }

  }

  _BlockTools.Code = Code;

  let Types = _decorate(null, function (_initialize) {
    class Types {
      constructor() {
        _initialize(this);
      }

    }

    return {
      F: Types,
      d: [{
        kind: "field",
        key: "table",

        value() {
          return {};
        }

      }, {
        kind: "method",
        key: "divert",
        value:
        /**
         * Like the @bound decorator, but when you actually want the value that
         * this was assigned too.
         * 
         * @param func Function to use this with, old value passed as first argument
         *   followed by the rest.
         */
        function divert(func) {
          let thisHere = this;
          return function (...args) {
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

      }, {
        kind: "field",
        key: "updateDropdown",

        value() {
          return this.divert(function (dropdown) {
            let data = Object.entries(this.table).map(a => a.reverse());
            let options = dropdown && dropdown.getValue() != "-1" ? [["Delete Type...", "-3"]] : [];
            return [["Anything", "-1"], ...data, ["Create Type...", "-2"], ...options];
          });
        }

      }, {
        kind: "field",
        key: "validateDropdown",

        value() {
          return this.divert(function (dropdown, option) {
            let switchObj = {
              "-2": () => this.createType() || null,
              "-3": () => this.deleteType(dropdown.sourceBlock_.workspace, dropdown.getValue())
            };
            let result = switchObj[option] ? switchObj[option]() : undefined;
            return result;
          });
        }

      }, {
        kind: "method",
        key: "getConstructArgs",
        value:
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
        function getConstructArgs() {
          return [this.updateDropdown, this.validateDropdown];
        }
      }, {
        kind: "method",
        decorators: [bound],
        key: "buildToolbox",
        value: function buildToolbox() {
          let obtainButton = (text, key) => obtainXml('<button text="' + text + '" callbackKey="' + key + '"/>');

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
      }, {
        kind: "method",
        decorators: [bound],
        key: "createType",
        value: function createType(button) {
          let name = prompt("Enter the name of the type to create...");
          if ([null, ""].includes(name)) return;
          if (Object.values(this.table).includes(name)) return alert('A type already exists with the name "' + name + '".');
          let position = Math.max(-1, ...Object.keys(this.table).map(int => parseInt(int))) + 1;
          this.table[position] = name;
          if (button) button.getTargetWorkspace().getToolbox().refreshSelection();
          return position.toString();
        }
      }, {
        kind: "method",
        decorators: [bound],
        key: "deleteType",
        value: function deleteType(argument, item, confirmm) {
          if (argument instanceof Blockly.Workspace) {
            if (!Object.keys(this.table).includes(item)) return false;

            if (!confirmm) {
              confirmm = confirm('Are you sure you want to delete the type "' + this.table[item] + '"?');
              if (!confirmm) return false;
            }

            let [id] = Object.entries(this.table).find(([key]) => key == item);
            delete this.table[id];

            for (let block of argument.getAllBlocks()) {
              if (block.type != "builder_type") continue;
              if (block.getField("type").getValue() == id) block.dispose(false, true);
            }

            return true;
          }

          let recent = this.table[Math.max(...Object.keys(this.table).map(a => parseInt(a)))];
          item = prompt("Enter the name of the type to delete...", recent);
          if ([null, ""].includes(item)) return false;
          item = Object.fromEntries(Object.entries(this.table).map(a => a.reverse()))[item];

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

      }, {
        kind: "method",
        key: "register",
        value: function register(workspace) {
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

      }, {
        kind: "method",
        key: "toType",
        value: function toType(value) {
          return value == "-1" ? null : this.table[value];
        }
      }]
    };
  });

  _BlockTools.Types = Types;

  class Builder {
    /**
     * Creates a new block builder used to make Blockly blocks.
     * 
     * @param name Internal code name of this block.
     */
    constructor(name) {
      _defineProperty(this, "name", void 0);

      _defineProperty(this, "colour", null);

      _defineProperty(this, "inputStyle", null);

      _defineProperty(this, "hat", undefined);

      _defineProperty(this, "inputs", []);

      _defineProperty(this, "output", undefined);

      _defineProperty(this, "previous", undefined);

      _defineProperty(this, "next", undefined);

      this.name = name;
    }
    /**
     * Appends a new ValueInput to this block.
     * 
     * @param name Internal code name of this input.
     * @returns This, for chaining.
     */


    appendValueInput(name) {
      this.inputs.push(new Builder.ValueInput(name));
      return this;
    }
    /**
     * Appends a new StatementInput to this block.
     * 
     * @param name Internal code name of this input.
     * @returns This, for chaining.
     */


    appendStatementInput(name) {
      this.inputs.push(new Builder.StatementInput(name));
      return this;
    }
    /**
     * Appends a new DummyInput to this block.
     * 
     * @returns This, for chaining.
     */


    appendDummyInput() {
      this.inputs.push(new Builder.DummyInput());
      return this;
    }
    /**
     * Returns the newest input appended to this block.
     * If no inputs exist yet, a DummyInput will be created.
     * 
     * @returns The newest input, otherwise a new DummyInput.
     */


    getLastInput() {
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


    appendField(field, name) {
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


    setAlign(alignment) {
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


    setCheck(...type) {
      let input = this.getLastInput();
      if (!(input instanceof Builder.TypedInput)) throw new TypeError("The last input provided is not a TypedInput.");
      input.setCheck(type);
      return this;
    }

    setOutput(...check) {
      if (typeof check[0] == "boolean") if (!check.shift()) return this;
      this.output = check.crumbleFlat();
      return this;
    }

    setPreviousStatement(...check) {
      if (typeof check[0] == "boolean") if (!check.shift()) return this;
      this.previous = check.crumbleFlat();
      return this;
    }

    setNextStatement(...check) {
      if (typeof check[0] == "boolean") if (!check.shift()) return this;
      this.next = check.crumbleFlat();
      return this;
    }

    setBothStatements(...check) {
      if (typeof check[0] == "boolean") if (!check.shift()) return this;
      this.next = check.crumbleFlat();
      this.previous = this.next;
      return this;
    }

    setHat(hat) {
      this.hat = hat ? "cap" : undefined;
      return this;
    }

    setInputsInline(inputStyle) {
      this.inputStyle = inputStyle;
      return this;
    }

    setColour(colour) {
      this.colour = colour;
      return this;
    }

    build() {
      let builder = this;

      let initFunc = function () {
        for (let builtInput of builder.inputs) {
          let name = {
            //Class names like to get mangled in compression.
            [Builder.DummyInput.name]: "DummyInput",
            [Builder.StatementInput.name]: "StatementInput",
            [Builder.ValueInput.name]: "ValueInput"
          }[builtInput.constructor.name];
          let typedInput = builtInput instanceof Builder.TypedInput ? builtInput : null;
          let input = this["append" + name](typedInput && typedInput.name);
          input.setAlign(builtInput.alignment);
          if (typedInput) input.setCheck(typedInput.acceptingType);

          for (let field of builtInput.fields) {
            if (typeof field == "string") {
              input.appendField(field);
              continue;
            }

            let name = {
              //Class names like to get mangled in compression.
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
      };

      return {
        "init": initFunc
      };
    }

    register() {
      Blockly.Blocks[this.name] = this.build();
    }

  }

  _BlockTools.Builder = Builder;

  (function (_Builder) {
    class Input {
      constructor() {
        _defineProperty(this, "fields", []);

        _defineProperty(this, "alignment", -1);
      }

      /**
       * Appends raw text or a field with a name to this input.
       * The name field is unnecessarry when appending text.
       * 
       * @param field Text / Field to add.
       * @param name Name of the field to add.
       */
      appendField(field, name) {
        if (typeof field == "string") return this.fields.push(field);
        field.name = name;
        this.fields.push(field);
      }
      /**
       * Sets the alignment of the text within this field.
       * 
       * @param alignment Alignment.
       */


      setAlign(alignment) {
        let convert = {
          "LEFT": -1,
          "CENTRE": 0,
          "RIGHT": 1
        };
        this.alignment = convert[alignment] != null ? convert[alignment] : alignment;
      }

    }

    _Builder.Input = Input;

    class TypedInput extends Builder.Input {
      constructor(name) {
        super();

        _defineProperty(this, "name", void 0);

        _defineProperty(this, "acceptingType", void 0);

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


      setCheck(...type) {
        this.acceptingType = type.crumbleFlat();
      }

    }

    _Builder.TypedInput = TypedInput;

    class ValueInput extends Builder.TypedInput {}

    _Builder.ValueInput = ValueInput;

    class StatementInput extends Builder.TypedInput {}

    _Builder.StatementInput = StatementInput;

    class DummyInput extends Builder.Input {}

    _Builder.DummyInput = DummyInput;

    class Field {
      constructor(value, validator) {
        _defineProperty(this, "name", void 0);

        _defineProperty(this, "value", void 0);

        _defineProperty(this, "validator", void 0);

        this.value = value;
        this.validator = validator;
      }

      getArguments() {
        return [this.value, this.validator];
      }

    }

    _Builder.Field = Field;

    class FieldAngle extends Builder.Field {}

    _Builder.FieldAngle = FieldAngle;

    class FieldTextInput extends Builder.Field {}

    _Builder.FieldTextInput = FieldTextInput;

    class FieldDropdown extends Builder.Field {
      constructor(options, validator) {
        if (!(options instanceof Array) && typeof options != "function") {
          options = Object.entries(options).map(([k, v]) => [v, k]);
        } else if (typeof options == "function") {
          let generator = options;

          options = function (...args) {
            let output = generator.apply(this, args);
            return !(output instanceof Array) ? Object.entries(output).map(([k, v]) => [v, k]) : output;
          };
        }

        super(options, validator);
      }

      getArguments() {
        return [this.value, this.validator];
      }

    }

    _Builder.FieldDropdown = FieldDropdown;
  })(Builder || (Builder = _BlockTools.Builder || (_BlockTools.Builder = {})));
})(BlockTools || (BlockTools = {}));