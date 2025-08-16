import * as Model from "./model";
import * as Chrome from "./chromeModel";
import * as Note from "./noteModel";
import * as Trie from "./trieModel";

export class ViewModel {
  private model_: Model.Model;
  public Subscriber: Subscriber;

  constructor() {
    this.model_ = new Model.Model();
    this.Subscriber = new Subscriber();
    this.model_.Subscriber.Subscribe(Model.SubscribeType.NoteIndex, (newIndex) => {
      // NOTE: Because index is counted from 0, need to be correct (index++)
      this.Subscriber.Notify(SubscribeType.UpdatedNoteIndex, newIndex + 1);
    });
    this.model_.Subscriber.Subscribe(Model.SubscribeType.Notes, (newNotes) => {
      this.Subscriber.Notify(SubscribeType.UpdatedNoteSize, newNotes.length);
    });
    this.model_.Subscriber.Subscribe(Model.SubscribeType.CurrentNote, (newNote) => {
      const note = newNote as Note.Note; // Type assertion is done inside the function body
      this.Subscriber.Notify(SubscribeType.UpdatedNoteTitle, note.notionPageInfo.title);
    });
  }

  public async ClickDebugBtn(index: number) {
    switch (index) {
      case 1:
        Model.Debug.ConsoleSaveData();
        break;
      case 2:
        this.model_.InitChromeSaveData();
        break;
      case 3:
        this.model_.UpdateCurrentNote();
        break;
      case 4:
        this.model_.AddNewNote();
        break;
      case 5:
        // this.model_.
        break;
      case 6:
        this.model_.NextNoteIndex();
        break;
      case 7:
        this.model_.BackNoteIndex();
        break;
    }
  }

  public async UpdateNotionApi(newValue: string) {
    this.model_.UpdateNotionApi(newValue);
  }

  public async UserSetNotionPageIdField(newValue: string) {
    this.model_.UpdateCurrentNoteNotionPageId(newValue);
  }

  // public ClickDebug3Btn() {
  //   chrome.runtime.sendMessage({ action: "NOTIFY_BACKGROUND" }, (response: String) => {
  //     if (response) {
  //       console.log("Received background message");
  //     }
  //   });
  // }
}

export enum SubscribeType {
  UpdatedNoteIndex = 0,
  UpdatedNoteSize = 1,
  UpdatedNoteTitle = 2,
}
type Callback = (data: any) => void;

type SubscribersDic = {
  [key in SubscribeType]?: Callback[];
};

class Subscriber {
  private subscribers: SubscribersDic = {};

  public Subscribe = (type: SubscribeType, callback: Callback): void => {
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
