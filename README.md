Block Builder V1.0.0
====================
A little site / project that allows you to make Blockly blocks, with Blockly blocks. The project is currently hosted using GitHub pages, at https://daniihh.github.io/.

Currently this is just a little hobby of mine, don't expect too much.

Usage
-----
### Entities
To first create a block, open up the Entities toolbox category in the editor workspace, and drag out a Block definition block.
![[Pulling out a Block definition block from the toolbox.]](documentation-assets/pullOut.gif "Pulling out a Block definition block from the toolbox.")

### Interface
A new block will be placed in the preview workspace. This block is a live view of the block you are making. Some code should also appear in the output section. This code can be utilized with the tools available from the Download Tools button.

### Inputs & Fields
From this point, you can add text, a new line, value and statement inputs, and connections all from the Inputs tab. Simply drag and drop any block below the Block definition block and watch as the preview block and code output update live.
![[An example of Inputs & Fields in the editor, and preview workspace.]](documentation-assets/example.png "An example of Inputs & Fields in the editor, and preview workspace.")

A text field block can be added from the Fields category.

### Values
You can change the default value of the text field by adding a text value from the Values category, along side a hue value, input style value, and alignment value.

### Types
Types can be made from the Types category, or the dropdown on a type block. Types modify what can and can't be modified. Types you add to your blocks won't immediately be visible, but can be seen in the code output, or by attempting to connect two blocks together that don't share the same type, or have the Anything type.
![[An image of the code output showing a type.]](documentation-assets/codeTyping.png "An image of the code output showing a type.")

Credits
-------
- [Blockly](https://developers.google.com/blockly/) - [Apache License 2.0](blockly/LICENSE) - What it's all built on.
- [Ace](https://ace.c9.io/) - [BSD License](ace/LICENSE) - For code output.
- [Closure Library](https://developers.google.com/closure/) - [Apache License 2.0](closure-library/LICENSE) - For blockly & other tidbits.
- [Type-Fest](https://github.com/sindresorhus/type-fest) - [MIT License](type-fest/LICENSE) - For whatchamacallits.