// The one menu item that opens the folder the notes live in. The id and the
// event it pushes are shared so a click and its answer cannot drift apart.

export const SHOW_DATA_FOLDER = 'show-data-folder';
export const DATA_FOLDER_EVENT = 'data-folder';

// The File menu is on every platform; the assistant's own items sit in the
// macOS application menu and are added beside this one.
export function fileMenus() {
  return [
    {
      title: 'File',
      items: [{ id: SHOW_DATA_FOLDER, label: 'Show data folder' }],
    },
  ];
}
