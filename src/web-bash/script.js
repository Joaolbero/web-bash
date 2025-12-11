let rootDirectory;
let currentDirectory;
let terminalOutputElement;
let terminalInputElement;
let promptElement;

function createDirectory(name, parent) {
  return {
    name,
    type: "dir",
    children: [],
    parent
  };
}

function initializeFileSystem() {
  const root = createDirectory("/", null);
  const home = createDirectory("home", root);
  const user = createDirectory("user", home);
  const documents = createDirectory("documents", user);
  const downloads = createDirectory("downloads", user);
  const projects = createDirectory("projects", user);

  root.children.push(home);
  home.children.push(user);
  user.children.push(documents, downloads, projects);

  rootDirectory = root;
  currentDirectory = user;
}

function getDirectoryPath(directory) {
  const segments = [];
  let current = directory;
  while (current && current.parent) {
    segments.unshift(current.name);
    current = current.parent;
  }
  return "/" + segments.join("/");
}

function getDisplayPath() {
  const fullPath = getDirectoryPath(currentDirectory);
  const homePrefix = "/home/user";
  if (fullPath === homePrefix) {
    return "~";
  }
  if (fullPath.startsWith(homePrefix)) {
    return "~" + fullPath.slice(homePrefix.length);
  }
  return fullPath;
}

function getPromptText() {
  return "user@webbash:" + getDisplayPath() + "$ ";
}

function updatePrompt() {
  if (promptElement) {
    promptElement.textContent = getPromptText();
  }
}

function appendLine(text, type) {
  const line = document.createElement("div");
  line.classList.add("terminal-line");
  if (type) {
    line.classList.add(type);
  }
  line.textContent = text;
  terminalOutputElement.appendChild(line);
  terminalOutputElement.scrollTop = terminalOutputElement.scrollHeight;
}

function resolvePath(path) {
  if (!path || path.length === 0) {
    return currentDirectory;
  }

  let target;
  if (path.startsWith("/")) {
    target = rootDirectory;
  } else {
    target = currentDirectory;
  }

  const parts = path.split("/").filter(function (p) {
    return p.length > 0;
  });

  for (const part of parts) {
    if (part === ".") {
      continue;
    }
    if (part === "..") {
      if (target.parent) {
        target = target.parent;
      }
      continue;
    }
    const next = target.children.find(function (child) {
      return child.type === "dir" && child.name === part;
    });
    if (!next) {
      return null;
    }
    target = next;
  }

  return target;
}

function handleLs(args) {
  let target = currentDirectory;
  if (args.length > 0) {
    const resolved = resolvePath(args[0]);
    if (!resolved) {
      appendLine("ls: cannot access '" + args[0] + "': No such file or directory", "error");
      return;
    }
    target = resolved;
  }

  const names = target.children
    .filter(function (child) {
      return child.type === "dir";
    })
    .map(function (child) {
      return child.name;
    })
    .sort();

  if (names.length === 0) {
    return;
  }

  appendLine(names.join("  "), "system");
}

function handleCd(args) {
  if (args.length === 0) {
    const home = resolvePath("/home/user");
    if (home) {
      currentDirectory = home;
      updatePrompt();
    }
    return;
  }

  const target = resolvePath(args[0]);
  if (!target) {
    appendLine("cd: no such file or directory: " + args[0], "error");
    return;
  }

  currentDirectory = target;
  updatePrompt();
}

function handleMkdir(args) {
  if (args.length === 0) {
    appendLine("mkdir: missing operand", "error");
    return;
  }

  const name = args[0];
  if (name.includes("/")) {
    appendLine("mkdir: invalid directory name", "error");
    return;
  }

  const exists = currentDirectory.children.find(function (child) {
    return child.name === name;
  });

  if (exists) {
    appendLine("mkdir: cannot create directory '" + name + "': File exists", "error");
    return;
  }

  const newDir = createDirectory(name, currentDirectory);
  currentDirectory.children.push(newDir);
}

function handlePwd() {
  appendLine(getDirectoryPath(currentDirectory), "system");
}

function handleClear() {
  terminalOutputElement.innerHTML = "";
}

function handleHelp() {
  const lines = [
    "Available commands:",
    "  ls [path]      List directories",
    "  cd [path]      Change directory",
    "  mkdir <name>   Create directory",
    "  pwd            Print working directory",
    "  clear          Clear terminal",
    "  help           Show this help"
  ];
  lines.forEach(function (line) {
    appendLine(line, "system");
  });
}

function handleCommand(input) {
  const trimmed = input.trim();

  appendLine(getPromptText() + trimmed, "command");

  if (trimmed.length === 0) {
    return;
  }

  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  if (command === "ls") {
    handleLs(args);
    return;
  }

  if (command === "cd") {
    handleCd(args);
    return;
  }

  if (command === "mkdir") {
    handleMkdir(args);
    return;
  }

  if (command === "pwd") {
    handlePwd();
    return;
  }

  if (command === "clear") {
    handleClear();
    return;
  }

  if (command === "help") {
    handleHelp();
    return;
  }

  appendLine("Command not found: " + command, "error");
}

function initializeTerminal() {
  terminalOutputElement = document.getElementById("terminal-output");
  terminalInputElement = document.getElementById("terminal-input");
  promptElement = document.getElementById("prompt");

  updatePrompt();
  appendLine("Web Bash pronto. Digite \"help\" para ver os comandos.", "system");

  terminalInputElement.focus();

  terminalInputElement.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      const value = terminalInputElement.value;
      terminalInputElement.value = "";
      handleCommand(value);
    }
  });

  document.addEventListener("click", function () {
    terminalInputElement.focus();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initializeFileSystem();
  initializeTerminal();
});