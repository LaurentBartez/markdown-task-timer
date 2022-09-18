import * as moment from 'moment'
class timeEntry {
    _start: Date;
    _end: Date;
    _durationMs: number;

    public formatted(dateFormat: string){
        return {            
                start : moment(this._start).format(dateFormat),
                end : moment(this._end).format(dateFormat),
                duration : +(this._durationMs / 1000 / 60 / 60).toFixed(2)
        }
    }
    constructor(start: Date, end: Date){
        this._start = start || null;
        this._end = end || null;
        var calcEnd =  end ? this._end : new Date();
        this._durationMs =  calcEnd.getTime()- this._start.getTime();
    }
  }

  export default timeEntry;
