
### Command line instructions

#### Git global setup

```bash
git config --global user.name "{{username}}"
git config --global user.email "{{email}}"
```

#### Create a new repository

```bash
git clone git@{{host}}:{{username}}/{{repos}}.git
cd test1
touch README.md
git add README.md
git commit -m "add README"
git push -u origin master
```

#### Existing folder

```bash
cd existing_folder
git init
git remote add origin git@{{host}}:{{username}}/{{repos}}.git
git add .
git commit -m "Initial commit"
git push -u origin master
```

#### Existing Git repository

```bash
cd existing_repo
git remote rename origin old-origin
git remote add origin git@{{host}}:{{username}}/{{repos}}.git
git push -u origin --all
git push -u origin --tags
```