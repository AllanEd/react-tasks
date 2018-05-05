import Dispatcher from './../Dispatcher.js';
import restHelper from './../helpers/restHelper.js';
import TaskListLocalStore from './../stores/TaskListLocalStore.js';
import Task from './../models/Task.js';

function TaskListStore() {
  let _tasks = [];
  let _online = true;
  const _registeredFunctions = [];

  function getTasks() {
    return _tasks;
  }

  function setTasks(newTasks) {
    _tasks = newTasks;
  }

  function addTask(newTask) {
    const newTasks = _tasks;
    newTasks.push(newTask);

    setTasks(newTasks);
  }

  function removeTask(deletedTask) {
    const newTasks = _tasks
      .filter(task => task._id !== deletedTask._id);

    setTasks(newTasks);
  }

  function updateTask(updatedTask) {
    const newTasks = _tasks;
    newTasks.forEach((task, index) => {
      if (task._id === updatedTask._id) {
        newTasks[index] = updatedTask;
      }
    });

    setTasks(newTasks);
  }

  function currentlyOnline() {
    return _online;
  }

  function setOnlineStatus(isOnline) {
    _online = isOnline;
  }

  function triggerRegisteredFunctions() {
    _registeredFunctions.forEach((registeredFuntion) => {
      registeredFuntion(getTasks());
    });
  }

  function generalSetTasks(updatedTasks) {
    TaskListLocalStore.setTasks(updatedTasks);
    setTasks(updatedTasks);
    restHelper.httpPost('api/tasks/create', updatedTasks);

    triggerRegisteredFunctions();
  }

  function compareOnlineAndLocalStore(onlineTasks) {
    return new Promise((resolve, reject) => {
      TaskListLocalStore
        .getTasks()
        .then((localTasks) => {
          const tasksOnline = onlineTasks;
          const tasksLocal = localTasks;
          const mergedTasks = [];

          for (let i = 0; i < tasksLocal.length; i += 1) {
            for (let y = 0; y < tasksOnline.length; y += 1) {
              if (tasksLocal[i]._id === tasksOnline[y]._id) {
                if (tasksLocal[i].__v >= tasksOnline[y].__v) {
                  mergedTasks.push(tasksLocal[i]);
                } else {
                  mergedTasks.push(tasksOnline[y]);
                }
                break;
              }
            }

            const mergeTasksLength = mergedTasks.length;
            let lastMergedTask =
              mergedTasks[mergeTasksLength - 1];

            if (typeof lastMergedTask === 'undefined') {
              lastMergedTask = [];
            }

            if (lastMergedTask._id !== tasksLocal[i]._id) {
              mergedTasks.push(tasksLocal[i]);
            }
          }

          resolve(mergedTasks);
        })
        .catch(() => reject());
    });
  }

  function generalGetTasks() {
    return new Promise((resolve, reject) => {
      restHelper
        .httpGet('api/tasks/get')
        .then((onlineTasks) => {
          if (currentlyOnline() === false) {
            setOnlineStatus(true);
          }

          compareOnlineAndLocalStore(onlineTasks)
            .then((comparedTasks) => {
              generalSetTasks(comparedTasks);
              resolve();
            });
        })
        .catch(() => {
          setOnlineStatus(false);

          TaskListLocalStore
            .getTasks()
            .then((localTasks) => {
              generalSetTasks(localTasks);
              resolve();
            })
            .catch(() => reject());
        });
    });
  }

  function generalCreateTask(task) {
    TaskListLocalStore.putTask(task);
    restHelper.httpPost('api/tasks/create', task);
    addTask(task);

    triggerRegisteredFunctions();
  }

  function generalDeleteTask(task) {
    TaskListLocalStore.deleteTask(task);
    restHelper.httpDelete('api/tasks/delete', task);
    removeTask(task);

    triggerRegisteredFunctions();
  }

  function generalUpdateTask(task) {
    TaskListLocalStore.putTask(task);
    restHelper.httpPatch('api/tasks/patch', task);
    updateTask(task);

    triggerRegisteredFunctions();
  }

  function getInitialTasks() {
    return new Promise((resolve) => {
      generalGetTasks()
        .then(() => resolve(getTasks()));
    });
  }

  function normalizeTask(task) {
    const currentTask =
      new Task(task.__v, task._id, task.content, task.done);

    if (currentlyOnline() === false) {
      currentTask.incrementVersion();
    }

    return currentTask.getValues();
  }

  Dispatcher.register((taskActions) => {
    const { action, task } = taskActions;

    const normalizedTask = normalizeTask(task);

    switch (action) {
      case 'create': {
        generalCreateTask(normalizedTask);
        break;
      }
      case 'update': {
        generalUpdateTask(normalizedTask);
        break;
      }
      case 'delete': {
        generalDeleteTask(normalizedTask);
        break;
      }
      default: {
        break;
      }
    }
  });

  function onChange(newRegisteredFuntion) {
    if (typeof newRegisteredFuntion === 'function') {
      _registeredFunctions.push(newRegisteredFuntion);
    }
  }

  return {
    getInitialTasks,
    onChange,
  };
}

export default TaskListStore();