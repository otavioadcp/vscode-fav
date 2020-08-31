const { resolve, basename } = require("path");
const {
  app,
  Menu,
  Tray,
  dialog,
  MenuItem,
  contentTracing,
} = require("electron");
const Store = require("electron-store");
const spawn = require("cross-spawn");
const fixPath = require("fix-path");

fixPath();

const schema = {
  projects: {
    type: "string",
  },
};
const store = new Store({ schema });
let mainTray = {};

if (app.dock) {
  app.dock.hide();
}

function render(tray = mainTray) {
  const storedProjects = store.get("projects");
  const projects = storedProjects ? JSON.parse(storedProjects) : [];

  const items = projects.map(({ name, path }) => ({
    label: name,
    submenu: [
      {
        label: "Open Repo",
        click: () => {
          spawn("code", [path], { shell: true });
        },
      },
      {
        label: "Remove Repo",
        click: () => {
          store.set(
            "projects",
            JSON.stringify(projects.filter((item) => item.path !== path))
          );
          render();
        },
      },
    ],
  }));

  const contextMenu = Menu.buildFromTemplate([
    ...items,
    {
      type: "separator",
    },
    {
      label: "Add Repo",
      click: () => {
        dialog
          .showOpenDialog({
            properties: ["openDirectory"],
          })
          .then((data) => {
            const path = data.filePaths[0];
            const name = basename(data.filePaths[0]);

            store.set(
              "projects",
              JSON.stringify([
                ...projects,
                {
                  path,
                  name,
                },
              ])
            );
            render();
          });
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

app.on("ready", async () => {
  mainTray = new Tray(resolve(__dirname, "assets", "iconTemplate.png"));
  render(mainTray);
});
