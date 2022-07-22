import User, {IUser} from '../models/user';
import Note, {MAX_LEVEL} from '../models/note';
import {Request, Response} from 'express';
import {Controller, Get} from './decorators';
import {Authenticate} from '../middleware/auth';

@Controller('/users')
export default class UserController {
  @Get('/me')
  @Authenticate
  async getMe(req: Request, res: Response) {
    const user = await User.findById((<IUser>req.user)._id);
    res.send(user);
  }

  @Get('/my-stats')
  @Authenticate
  async getMyStats(req: Request, res: Response) {
    const now = Date.now();
    const userId = (<IUser>req.user)._id;
    const noteCountPromise = Note.count({creator: userId});
    const dueNoteCountPromise = Note.count({
      creator: userId,
      dueAt: {$lte: now},
      burnedAt: {$exists: false},
    });
    const burnedCountPromise = Note.count({
      creator: userId,
      burnedAt: {$exists: true},
    });

    const notesDueInNextWeekPromise = Note.find({
      creator: userId,
      dueAt: {$lte: new Date(now + 7 * 24 * 60 * 60 * 1000)},
      burnedAt: {$exists: false},
    });

    const [noteCount, dueNoteCount, burnedCount, notesDueInNextWeek] =
      await Promise.all([
        noteCountPromise,
        dueNoteCountPromise,
        burnedCountPromise,
        notesDueInNextWeekPromise,
      ]);

    const timeline = new Array<number[]>(7 * 24);
    for (let i = 0; i < timeline.length; i++) {
      timeline[i] = new Array<number>(MAX_LEVEL).fill(0);
    }

    for (const note of notesDueInNextWeek) {
      const hourDue = Math.max(
        0,
        Math.ceil((note.dueAt!.getTime() - now) / (60 * 60 * 1000))
      );
      timeline[hourDue][note.level] += 1;
    }

    const notesByLevelPromises = new Array(MAX_LEVEL + 1).fill(0);
    for (let i = 0; i < notesByLevelPromises.length; i++) {
      notesByLevelPromises[i] = Note.count({
        creator: userId,
        level: i,
      });
    }

    const notesPerLevel = await Promise.all(notesByLevelPromises);

    res.send({
      notes: noteCount,
      dueNotes: dueNoteCount,
      burnedNotes: burnedCount,
      timeline,
      notesPerLevel,
    });
  }
}
