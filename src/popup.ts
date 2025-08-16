// import * as T from "./commonType";
import * as ViewModel from "./viewModel";

document.addEventListener("DOMContentLoaded", async () => {
  const viewModel_ = new ViewModel.ViewModel();

  const inputNotionApi = document.getElementById("inputNotionApi") as HTMLInputElement;
  inputNotionApi.addEventListener("input", (event) => {
    const newValue = (event.target as HTMLInputElement).value;
    viewModel_.UpdateNotionApi(newValue);
  });

  const inputNotionPageId = document.getElementById("inputNotionPageId") as HTMLInputElement;
  inputNotionPageId.addEventListener("input", (event) => {
    const newValue = (event.target as HTMLInputElement).value;
    viewModel_.UserSetNotionPageIdField(newValue);
  });

  /**
   * 以下正式版可以直接刪除
   */
  const tmpIndex = document.getElementById("tmpIndex") as HTMLHeadingElement;
  viewModel_.Subscriber.Subscribe(ViewModel.SubscribeType.UpdatedNoteIndex, (newIndex) => {
    tmpIndex.textContent = newIndex;
  });

  const tmpSum = document.getElementById("tmpSum") as HTMLHeadingElement;
  viewModel_.Subscriber.Subscribe(ViewModel.SubscribeType.UpdatedNoteSize, (newSize) => {
    tmpSum.textContent = newSize;
  });

  const tmpTitle = document.getElementById("tmpTitle") as HTMLHeadingElement;
  viewModel_.Subscriber.Subscribe(ViewModel.SubscribeType.UpdatedNoteTitle, (newTitle) => {
    tmpTitle.textContent = newTitle;
  });

  const btn1 = document.getElementById("btn1") as HTMLButtonElement;
  btn1.addEventListener("click", () => {
    viewModel_.ClickDebugBtn(1);
  });

  const btn2 = document.getElementById("btn2") as HTMLButtonElement;
  btn2.addEventListener("click", () => {
    viewModel_.ClickDebugBtn(2);
  });

  const btn3 = document.getElementById("btn3") as HTMLButtonElement;
  btn3.addEventListener("click", () => {
    viewModel_.ClickDebugBtn(3);
  });

  const btn4 = document.getElementById("btn4") as HTMLButtonElement;
  btn4.addEventListener("click", () => {
    viewModel_.ClickDebugBtn(4);
  });

  const btn5 = document.getElementById("btn5") as HTMLButtonElement;
  btn5.addEventListener("click", () => {
    viewModel_.ClickDebugBtn(5);
  });

  const btn6 = document.getElementById("btn6") as HTMLButtonElement;
  btn6.addEventListener("click", () => {
    viewModel_.ClickDebugBtn(6);
  });

  const btn7 = document.getElementById("btn7") as HTMLButtonElement;
  btn7.addEventListener("click", () => {
    viewModel_.ClickDebugBtn(7);
  });

  // TODO: 資料請個別訂閱，並且不依賴COMMON TYPE
  // const onSaveDataUpdate = (newValue: T.ChromeSaveData) => {
  //   inputNotionApi.value = newValue.notionApi;
  //   inputNotionPageId.value = newValue.notes[newValue.noteIndex].notionPageInfo.pageId;

  //   /**
  //    * 以下正式版可以直接刪除
  //    */
  //   tmpIndex.textContent = (newValue.noteIndex + 1).toString();
  //   tmpSum.textContent = newValue.notes.length.toString();
  //   tmpTitle.textContent = newValue.notes[newValue.noteIndex].notionPageInfo.title;
  // };
  // viewModel_.WatchChromeSaveData(onSaveDataUpdate);
});
