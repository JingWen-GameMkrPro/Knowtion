// import * as T from "./commonType";
import * as ViewModel from "./viewModel";

document.addEventListener("DOMContentLoaded", async () => {
  const viewModel_ = new ViewModel.ViewModel();

  const inputNotionApi = document.getElementById("inputNotionApi") as HTMLInputElement;
  inputNotionApi.addEventListener("input", (event) => {
    const newValue = (event.target as HTMLInputElement).value;
    viewModel_.UpdateNotionApi(newValue);
  });
  // HACK: Only use in initial
  viewModel_.Subscriber.Subscribe(ViewModel.SubscribeType.UpdatedNotionApi, (newApi) => {
    inputNotionApi.value = newApi;
  });

  const inputNotionPageId = document.getElementById("inputNotionPageId") as HTMLInputElement;
  inputNotionPageId.addEventListener("input", (event) => {
    const newValue = (event.target as HTMLInputElement).value;
    viewModel_.UpdatePageId(newValue);
  });
  // HACK: Only use in initial
  viewModel_.Subscriber.Subscribe(ViewModel.SubscribeType.UpdatedPageId, (newPageId) => {
    inputNotionPageId.value = newPageId;
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

  const btn8 = document.getElementById("btn8") as HTMLButtonElement;
  btn8.addEventListener("click", () => {
    viewModel_.ClickDebugBtn(8);
  });

  const btn9 = document.getElementById("btn9") as HTMLButtonElement;
  btn9.addEventListener("click", () => {
    viewModel_.ClickDebugBtn(9);
  });

  viewModel_.InitSubscriberData();
});
