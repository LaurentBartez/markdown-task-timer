'use strict';
import * as vscode from 'vscode';
import * as moment from 'moment';
import Task from './task';

class TimerStatusBarItem {
    _statusBarItem: vscode.StatusBarItem;
    _interval: any;
    _start: number;

    public setTask(task: Task) {
        if (task.isActive) {
            this._start = task.getTimeStamp(task.countToggles - 1);
            this._statusBarItem.tooltip =  task.getTitle;
        }
        else {
            this.removeTask();        
        }     
    }

    public removeTask(){
        this._start = 0;
        this._statusBarItem.tooltip = 'no active task';
        this._statusBarItem.hide();
    }  
  constructor() {
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -100) || null;
    this._statusBarItem.tooltip =  'no active task';
    this._start = 0;
    this._statusBarItem.hide();

    this._interval = setInterval(() => this.refreshUI(), 1000);

    this.refreshUI();
  }

  dispose() {
    this._statusBarItem.dispose();
    clearInterval(this._interval);
  }

  refreshUI() {
    if (this._start === 0){
        this._statusBarItem.text =  'no active task';
        this._statusBarItem.hide();

    }
    else{
        const currentDate = new Date;
        const start = new Date(this._start);
        this._statusBarItem.text = moment.utc(currentDate.getTime() - start.getTime()).format('HH:mm:ss');
        this._statusBarItem.show();

    }

  }
}

export default TimerStatusBarItem;