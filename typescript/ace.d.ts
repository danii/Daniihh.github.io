
declare namespace ace {
  function edit(element: Element | string, options: Object);

  class Editor {
    setValue(val: string, cursorPos?: number): string;
  }
}