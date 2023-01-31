# Markdown Task Timer 

Add timers to your markdown task-list and get a report summarizing your efforts. 

## Features

- add timestamps to todo-tasks. The timestamp format is `[YYYY-MM-DD hh:mm]`.
- indicate active tasks in editor
- show timer in status bar whenever there is an active task
- make a comprehensive report
- cycle through task state with key-shortcuts (text -> bullet -> in work -> done -> text)  

## Usage

Place cursor in a line with a markdown task and press `ctrl+alt+l` to add a timestamp. Existing active tasks will be set inactive before a new one is activated. A timer in the status bar indicates the elapsed time of the current active task. You can click on the timer to find the active task in your workspace.

![add timer](images/log.gif)

Use the `makeReport`-Command to get a markdown-formatted summary of your timestamps. 
![make report](images/make-Report.gif)

There is a report for the current document or the complete workspace. The workspace report can be restricted with start and end date. Instead of giving a date in `YYYY-MM-DD` the following keywords can be used to refer to current date:

 - day
 - week
 - month
 - year

Additionally it is possible to state an offset. For example a start-date: `month-1` and end-date: `day+2` generates a report from beginning of last month until the end of the day after tomorrow.



Use `ctrl+alt+[Period]` for promoting, or `ctrl+alt+[Comma]` for demoting text lines to 'done'-state or vice-versa. Supports multicursor operations.

![cycle status](images/cycle.gif)

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
