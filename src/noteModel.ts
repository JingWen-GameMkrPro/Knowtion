export interface Note {
  notionPageInfo: NotionPageInfo;
  notionPage: NotionPage;
  blocks: Block[];
}

export function CreateNote(): Note {
  return {
    notionPageInfo: CreateNotionPageInfo(),
    notionPage: CreateNotionPage(),
    blocks: [],
  };
}

export interface NotionPageInfo {
  pageId: string;

  title: string;

  lastEditedTime: Number;

  fetchTime: Number;
}

export function CreateNotionPageInfo(): NotionPageInfo {
  return {
    pageId: "",
    title: "",
    lastEditedTime: new Number(),
    fetchTime: new Number(),
  };
}

export interface NotionPage {
  notionBlocks: string[];
}

export function CreateNotionPage(): NotionPage {
  return {
    notionBlocks: [],
  };
}

export interface Block {
  blockKey: string;
  blockValues: BlockValue[]; //區塊內容
}

export function CreateBlock(): Block {
  return {
    blockKey: "",
    blockValues: [],
  };
}

export interface BlockValue {
  color: BlockValueColor;
  type: BlockValueType;
  value: string;
}

export enum BlockValueColor {
  Normal,
  Red,
  Blue,
  Green,
}

export enum BlockValueType {
  text,
  referenceText,
  warningText,
  exampleText,
}

export function CreateBlockValue(): BlockValue {
  return {
    color: BlockValueColor.Normal,
    type: BlockValueType.text,
    value: "",
  };
}
