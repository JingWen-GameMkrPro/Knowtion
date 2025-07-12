import { ViewModel } from "./viewModel";

document.addEventListener("DOMContentLoaded", () => {
  const _viewModel = new ViewModel();

  /**
   * Binding HTML Element
   */
  const inputNotionApi = document.getElementById(
    "inputNotionApi"
  ) as HTMLInputElement;

  const inputNotionPageId = document.getElementById(
    "inputNotionPageId"
  ) as HTMLInputElement;

  const btnAddNote = document.getElementById("btnAddNote") as HTMLButtonElement;
  const btnUpdate = document.getElementById("btnUpdate") as HTMLButtonElement;
  const btnDeleteNote = document.getElementById(
    "btnDeleteNote"
  ) as HTMLButtonElement;

  /**
   * Binding HTML User Input
   */
  btnUpdate.addEventListener("click", () => {
    const value1 = inputNotionApi.value;
    const value2 = inputNotionPageId.value;

    console.log("第一個輸入框的值:", value1);
    console.log("第二個輸入框的值:", value2);

    _viewModel.test(value1, value2, 1);
  });

  /**
   * Binding Data
   */
});
