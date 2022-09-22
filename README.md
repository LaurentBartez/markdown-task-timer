# markdown-todo-timer README

Inspired from the emacs org-mode clocking feature I created this vs-code extension.  

The intention is to have a similar functionality for todo-lists based on markdown syntax. 

**Currently this project is not released to the marketplace as I just started the development.**
## Features

- add timestamps to todo-tasks. The timestamp format is [YYYY-MM-DD hh:mm].
- indicate active tasks in editor
- show timer in status bar whenever there is an active task
- make a comprehensive report
- cycle through task state with key-shortcuts (text -> bullet -> in work -> done -> text)  

## Extension Settings

This extension contributes the following commands:

- `markdown-todo-timer.toggleTimer (ctrl+alt+[Minus])`: Toggles the timer. Active tasks will be set inactive. If there is no active tasks, the selected task will be toggled to active 
- `markdown-todo-timer.promoteTask (ctrl+alt+[Period])`: Cycles through task state promoting
- `markdown-todo-timer.promoteTask (ctrl+alt+[Comma])`: Cycles through task state demoting    
- `markdown-todo-timer.makeReport`: Creates a report that summarizes your timestamps in a new editor. Of course formatted as markdown 


## Known Issues

tbd
## Release Notes

unreleased

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
