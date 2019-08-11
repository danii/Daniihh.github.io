/*
 * Google has recently added TypeScript typings, (yay, thanks Google!) but the
 * newer Blockly assets causes incompatibility issues with my program, (am too
 * lazy to fix!) also Blockly doesn't have a versioning system, (with every
 * thing they do right they get two things wrong ;~;) so for now here is this
 * janky type declarations file.
 */

declare namespace goog {
  namespace math {
    class Rect {
      left: number;
      top: number;
      width: number;
      height: number;

      constructor(x: number, y: number, w: number, h: number);
      contains(another: Rect | Coordinate): boolean;
      intersects(rect: Rect): boolean;
      translate(tx: Coordinate): this;
      translate(tx: number, ty: number): this;
    }

    class Coordinate {
      x: number;
      y: number;

      constructor(opt_x?: number, opt_y?: number);
    }
  }
}

declare class Blockly {
  static Blocks: {[key: string]: {init: (this: Blockly.Block) => void}};
  
  static inject(container: NonNullable<Element | string>, options?: Object): Blockly.Workspace;
  static svgResize(workspace: Blockly.WorkspaceSvg): void;
  static svgSize(workspace: Blockly.WorkspaceSvg): {width: number, height: number};
}

declare namespace Blockly {
  class Block {
    hat: string;
    id: string;
    inputList: Blockly.Input[];
    nextConnection: Blockly.Connection;
    outputConnection: Blockly.Connection;
    previousConnection: Blockly.Connection;
    type: string;
    workspace: Blockly.Workspace;

    appendDummyInput(opt_name?: string): Blockly.Input;
    appendStatementInput(name: string): Blockly.Input;
    appendValueInput(name: string): Blockly.Input;
    dispose(healStack?: boolean, ...other: undefined[]): void;
    getField(name: string): Blockly.Field;
    getFieldValue(name: string): string;
    getInput(name: string): Blockly.Input;
    getInputTargetBlock(name: string): Blockly.Block;
    getNextBlock(): Blockly.Block;
    getPreviousBlock(): Blockly.Block;
    isInsertionMarker(): boolean;
    isMoveable(): boolean;
    isShadow(): boolean;
    setColour(hue: number): void;
    setOutput(newBoolean: boolean, opt_check?: string | string[]);
    setInputsInline(newBoolean: boolean);
    setNextStatement(newBoolean: boolean, opt_check?: string | string[]);
    setPreviousStatement(newBoolean: boolean, opt_check?: string | string[]);
  }

  class BlockSvg extends Blockly.Block {
    dispose(healStack?: boolean, animate?: boolean): void;
    getBoundingRectangle(): {topLeft: goog.math.Coordinate, bottomRight: goog.math.Coordinate};
    initSvg(): void;
    render(opt_bubble?: boolean): void;
    scheduleSnapAndBump(): void;
    snapToGrid(): void;
  }

  class Connection {
    disconnect(): void;
    isConnected(): boolean;
  }

  namespace Events {
    class Abstract {}

    class BlockBase extends Blockly.Events.Abstract {}

    class Move extends Blockly.Events.BlockBase {}

    class Ui extends Blockly.Events.Abstract {}
  }

  class Field {
    sourceBlock_: Blockly.Block;

    getValue(): string;
  }

  class FieldDropdown extends Blockly.Field {}

  class FlyoutButton {
    getTargetWorkspace(): Blockly.WorkspaceSvg;
  }

  class Input {
    connection: Blockly.Connection;

    dispose(): void;
  }

  class Options {
    parentWorkspace: Blockly.Workspace;
  }

  class Toolbox {
    refreshSelection(): void;
  }

  abstract class Workspace {
    options: Blockly.Options;

    addChangeListener(func: (event: Blockly.Events.Abstract) => void): Function;
    getAllBlocks(): Blockly.Block[];
  }

  class WorkspaceSvg extends Blockly.Workspace {
    scrollX: number;
    scrollY: number;

    getParentSvg(): Element;
    getToolbox(): Blockly.Toolbox;
    newBlock(prototypeName: string, opt_id?: string): Blockly.Block;
    refreshToolboxSelection(): void;
    resize(): void;
    registerButtonCallback(key: string, func: (button: Blockly.FlyoutButton) => void): void;
    registerToolboxCategoryCallback(key: string, func: (workspace: Blockly.Workspace) => void): void;
  }

  namespace Xml {
    function appendDomToWorkspace(xml: Element, workspace: Blockly.Workspace): void;
    function textToDom(text: string): Element;
  }
}
