# Backstage upgrade helper diff

This repository exposes an untouched Backstage app generated with the CLI
`npx @backstage/create-app`. Each new Backstage release causes a new project to be created, removing the old one, and getting a diff between them. This way, the diff is always clean, always in sync with the changes of the init template.

A dedicated branch per release makes changes very easy
to watch.

## Find the diff you need

https://backstage.github.io/upgrade-helper/

## Notes

This project follows the same concepts introduced by [React Native diff PURGE](https://github.com/react-native-community/rn-diff-purge). Read more [here](https://github.com/react-native-community/rn-diff-purge/blob/master/README.md#history-of-this-repo) about the idea and history behind the project.
