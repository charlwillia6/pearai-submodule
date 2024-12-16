import { SlashCommand } from "../../index.js";
import GenerateTerminalCommand from "./cmd.js";
import CommentSlashCommand from "./comment.js";
import CommitMessageCommand from "./commit.js";
import ComponentMessageCommand from "./component.js";
import DraftIssueCommand from "./draftIssue.js";
import EditSlashCommand from "./edit.js";
import HttpSlashCommand from "./http.js";
import { 
  reviewWorkingStateCommand, 
  reviewMainCommand, 
  reviewLastCommitCommand 
} from "./review";
import ShareSlashCommand from "./share.js";
import StackOverflowSlashCommand from "./stackOverflow.js";

const commands: SlashCommand[] = [
  DraftIssueCommand,
  ShareSlashCommand,
  StackOverflowSlashCommand,
  GenerateTerminalCommand,
  EditSlashCommand,
  CommentSlashCommand,
  HttpSlashCommand,
  CommitMessageCommand,
  ComponentMessageCommand,
  reviewWorkingStateCommand,
  reviewMainCommand,
  reviewLastCommitCommand
];

export default commands;
