import * as Chrome from "./chromeModel";
import * as Note from "./noteModel";
import * as Trie from "./trieModel";
import * as ChromeRuntimeCommon from "./chromeRuntimeCommon";
import * as ChromeRuntimeHandler from "./chromeRuntimeHandler";

// 組合各種子MODEL服務，並提供給VIEWMODE
export class Model {
  public Subscriber: Subscriber;

  constructor() {
    this.Subscriber = new Subscriber();
    this.Subscriber.Subscribe(SubscribeType.Notes, this.updateTrie);
  }

  // NOTE: trigger when note updated
  // NOTE: This method is a callback, its 'this' context will not be the class instance, causing a 'this' binding error.
  // NOTE: Use an arrow function to auto maintain the class instance context.
  updateTrie = async (newNotes: Note.Note[]): Promise<void> => {
    let saveData = await Chrome.Service.GetChromeSaveData();
    saveData = Trie.Service.UpdateTrie(saveData);
    ChromeRuntimeHandler.Service.SendMessage(ChromeRuntimeCommon.BackgroundMessageType.UpdatedTrie);
    await Chrome.Service.SetChromeSaveData(saveData);
  };

  // UserInput: add new note
  public async AddNewNote() {
    // Get
    let saveData = await Chrome.Service.GetChromeSaveData();

    // Edit
    saveData = Note.Service.AddNewNote(saveData);

    // Notify
    this.Subscriber.Notify(SubscribeType.NoteIndex, saveData.noteIndex);
    this.Subscriber.Notify(SubscribeType.Notes, saveData.notes);
    this.Subscriber.Notify(SubscribeType.CurrentNote, saveData.notes[saveData.noteIndex]);

    // Set
    await Chrome.Service.SetChromeSaveData(saveData);
  }

  // UserInput: next current index
  public async NextNoteIndex() {
    let saveData = await Chrome.Service.GetChromeSaveData();
    saveData = Note.Service.NextNoteIndex(saveData);
    this.Subscriber.Notify(SubscribeType.NoteIndex, saveData.noteIndex);
    this.Subscriber.Notify(SubscribeType.CurrentNote, saveData.notes[saveData.noteIndex]);
    await Chrome.Service.SetChromeSaveData(saveData);
  }

  // UserInput: back current index
  public async BackNoteIndex() {
    let saveData = await Chrome.Service.GetChromeSaveData();
    saveData = Note.Service.BackNoteIndex(saveData);
    this.Subscriber.Notify(SubscribeType.NoteIndex, saveData.noteIndex);
    this.Subscriber.Notify(SubscribeType.CurrentNote, saveData.notes[saveData.noteIndex]);
    await Chrome.Service.SetChromeSaveData(saveData);
  }

  // UserInput: update notion api
  public async UpdateNotionApi(newValue: string) {
    let saveData = await Chrome.Service.GetChromeSaveData();
    saveData = Note.Service.UpdateNotionApi(saveData, newValue);
    this.Subscriber.Notify(SubscribeType.NotionApi, saveData.notionApi);
    await Chrome.Service.SetChromeSaveData(saveData);
  }

  // UserInput: update notion page id
  public async UpdatePageId(newValue: string) {
    let saveData = await Chrome.Service.GetChromeSaveData();
    saveData = Note.Service.UpdateCurrentNoteNotionPageId(saveData, newValue);
    this.Subscriber.Notify(SubscribeType.CurrentNote, saveData.notes[saveData.noteIndex]);
    await Chrome.Service.SetChromeSaveData(saveData);
  }

  // UserInput: update current note
  public async UpdateCurrentNote(): Promise<any | null> {
    let saveData = await Chrome.Service.GetChromeSaveData();
    saveData = await Note.Service.UpdateCurrentNote(saveData);
    this.Subscriber.Notify(SubscribeType.CurrentNote, saveData.notes[saveData.noteIndex]);
    await Chrome.Service.SetChromeSaveData(saveData);
  }

  // UserInput: init save datas
  public async InitChromeSaveData(): Promise<any | null> {
    const saveData = await Chrome.Service.InitChromeSaveData();
    this.Subscriber.Notify(SubscribeType.NoteIndex, saveData.noteIndex);
    this.Subscriber.Notify(SubscribeType.Notes, saveData.notes);
    this.Subscriber.Notify(SubscribeType.CurrentNote, saveData.notes[saveData.noteIndex]);
  }

  public async UpdateHighlightMode(isHighlight: boolean): Promise<any | null> {
    let saveData = await Chrome.Service.GetChromeSaveData();
    saveData.isHighlight = isHighlight;

    ChromeRuntimeHandler.Service.SendMessage(ChromeRuntimeCommon.BackgroundMessageType.Debug);

    await Chrome.Service.SetChromeSaveData(saveData);
  }

  public async InitSubscriberData() {
    const saveData = await Chrome.Service.GetChromeSaveData();
    this.Subscriber.Notify(SubscribeType.NoteIndex, saveData.noteIndex);
    this.Subscriber.Notify(SubscribeType.Notes, saveData.notes);
    this.Subscriber.Notify(SubscribeType.CurrentNote, saveData.notes[saveData.noteIndex]);
    this.Subscriber.Notify(SubscribeType.NotionApi, saveData.notionApi);
  }
}

export enum SubscribeType {
  NoteIndex = 2,
  Notes = 3,
  CurrentNote = 5,
  NotionApi = 6,
}

type Callback = (data: any) => void;

type SubscribersDic = {
  [key in SubscribeType]?: Callback[];
};

class Subscriber {
  private subscribers: SubscribersDic = {};

  public Subscribe = async (type: SubscribeType, callback: Callback): Promise<void> => {
    if (!this.subscribers[type]) {
      this.subscribers[type] = [];
    }
    this.subscribers[type]!.push(callback);
  };

  public Notify = (type: SubscribeType, data: any): void => {
    const callbacks = this.subscribers[type];
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  };

  public Unsubscribe = (type: SubscribeType, callback: Callback): void => {
    const callbacks = this.subscribers[type];
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  };
}

export class Debug {
  public static async ConsoleSaveData(): Promise<void> {
    console.log(await Chrome.Service.GetChromeSaveData());
  }
}
