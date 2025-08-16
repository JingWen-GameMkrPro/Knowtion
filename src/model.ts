import * as Chrome from "./chromeModel";
import * as Note from "./noteModel";
import * as Trie from "./trieModel";

// 組合各種子MODEL服務，並提供給VIEWMODE
export class Model {
  constructor() {
    // TODO:
    // this.WatchChromeSaveDataNotes(Trie.updateTrie);
  }
  // NOTE: trigger when note updated
  // NOTE: This method is a callback, its 'this' context will not be the class instance, causing a 'this' binding error.
  // NOTE: Use an arrow function to auto maintain the class instance context.
  updateTrie = async (newNotes: Note.Note[]): Promise<void> => {
    const saveData = await Chrome.Service.GetChromeSaveData();

    const blockCollection = newNotes.flatMap((note) => note.blocks);
    saveData.trie = Trie.MakeTrie(blockCollection);

    await Chrome.Service.SetChromeSaveData(saveData);
  };

  // UserInput: add new note
  public async AddNewNote() {
    let saveData = await Chrome.Service.GetChromeSaveData();
    saveData = Note.Service.AddNewNote(saveData);
    await Chrome.Service.SetChromeSaveData(saveData);
  }

  // UserInput: next current index
  public async NextNoteIndex() {
    let saveData = await Chrome.Service.GetChromeSaveData();
    saveData = Note.Service.NextNoteIndex(saveData);
    await Chrome.Service.SetChromeSaveData(saveData);
  }

  // UserInput: back current index
  public async BackNoteIndex() {
    let saveData = await Chrome.Service.GetChromeSaveData();
    saveData = Note.Service.BackNoteIndex(saveData);
    await Chrome.Service.SetChromeSaveData(saveData);
  }

  // UserInput: update notion api
  public async UpdateNotionApi(newValue: string) {
    let saveData = await Chrome.Service.GetChromeSaveData();
    saveData = Note.Service.UpdateNotionApi(saveData, newValue);
    await Chrome.Service.SetChromeSaveData(saveData);
  }

  // UserInput: update notion page id
  public async UpdateCurrentNoteNotionPageId(newValue: string) {
    let saveData = await Chrome.Service.GetChromeSaveData();
    saveData = Note.Service.UpdateCurrentNoteNotionPageId(saveData, newValue);
    await Chrome.Service.SetChromeSaveData(saveData);
  }

  // UserInput: update current note
  public async UpdateCurrentNote(): Promise<any | null> {
    let saveData = await Chrome.Service.GetChromeSaveData();
    saveData = await Note.Service.UpdateCurrentNote(saveData);
    await Chrome.Service.SetChromeSaveData(saveData);
  }
}
