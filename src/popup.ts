import * as T from "./commonType";
import { ViewModel } from "./viewModel";

document.addEventListener("DOMContentLoaded", async () => {
  const viewModel_ = new ViewModel();

  const inputNotionApi = document.getElementById("inputNotionApi") as HTMLInputElement;
  inputNotionApi.addEventListener("input", (event) => {
    const newValue = (event.target as HTMLInputElement).value;
    viewModel_.UserSetNotionApiField(newValue);
  });

  const inputNotionPageId = document.getElementById("inputNotionPageId") as HTMLInputElement;
  inputNotionPageId.addEventListener("input", (event) => {
    const newValue = (event.target as HTMLInputElement).value;
    viewModel_.UserSetNotionPageIdField(newValue);
  });

  const btnDeleteNote = document.getElementById("btnDeleteNote") as HTMLButtonElement;

  const btnUpdate = document.getElementById("btnUpdate") as HTMLButtonElement;
  btnUpdate.addEventListener("click", () => {
    viewModel_.ClickUpdateBtn();
  });

  /**
   * 以下正式版可以直接刪除
   */
  const tmpIndex = document.getElementById("tmpIndex") as HTMLHeadingElement;
  const tmpSum = document.getElementById("tmpSum") as HTMLHeadingElement;
  const tmpTitle = document.getElementById("tmpTitle") as HTMLHeadingElement;
  const btnClear = document.getElementById("btnClear") as HTMLButtonElement;
  btnClear.addEventListener("click", () => {
    viewModel_.ClickClearBtn();
  });
  const btnDebug = document.getElementById("btnDebug") as HTMLButtonElement;
  btnDebug.addEventListener("click", () => {
    viewModel_.ClickDebugBtn();
  });
  const btnDebug2 = document.getElementById("btnDebug2") as HTMLButtonElement;
  btnDebug2.addEventListener("click", () => {
    viewModel_.ClickDebug2Btn();
  });
  const btnDebug3 = document.getElementById("btnDebug3") as HTMLButtonElement;
  btnDebug3.addEventListener("click", () => {
    viewModel_.ClickDebug3Btn();
  });

  const btnNext = document.getElementById("btnNext") as HTMLButtonElement;
  btnNext.addEventListener("click", () => {
    viewModel_.ClickNextBtn();
  });
  const btnBack = document.getElementById("btnBack") as HTMLButtonElement;
  btnBack.addEventListener("click", () => {
    viewModel_.ClickBackBtn();
  });
  const btnAddNote = document.getElementById("btnAddNote") as HTMLButtonElement;
  btnAddNote.addEventListener("click", () => {
    viewModel_.ClickAddBtn();
  });

  // Init
  var object = await viewModel_.GetStorageObject();
  if (object) {
    inputNotionApi.value = object.notionApi;
    inputNotionPageId.value = object.noteList[object.noteListIndex][0].pageId;

    /**
     * 以下正式版可以直接刪除
     */
    tmpIndex.textContent = (object.noteListIndex + 1).toString();
    tmpSum.textContent = object.noteList.length.toString();
    tmpTitle.textContent = object.noteList[object.noteListIndex][0].title;
  }

  const onStorageObjectUpdate = (newValue: T.StorageObject) => {
    inputNotionApi.value = newValue.notionApi;
    inputNotionPageId.value = newValue.noteList[newValue.noteListIndex][0].pageId;

    /**
     * 以下正式版可以直接刪除
     */
    tmpIndex.textContent = (newValue.noteListIndex + 1).toString();
    tmpSum.textContent = newValue.noteList.length.toString();
    tmpTitle.textContent = newValue.noteList[newValue.noteListIndex][0].title;
  };
  viewModel_.SubscribeStorageObject(onStorageObjectUpdate);
});
