import React from 'react';
import PropTypes from 'prop-types';
import TaskCounter from './../taskCounter/TaskCounter.jsx';
import Task from './../task/Task.jsx';
import TaskListAddTask from './../taskListAddTask/TaskListAddTask.jsx';

class TaskList extends React.Component {
  constructor(props) {
    super(props);

    this.state = { selected: null };

    this.tasksOpen = [];
    this.tasksCompleted = [];
    this.showCompleted = false;

    this.buildTask = this.buildTask.bind(this);
    this.setSelectedTask = this.setSelectedTask.bind(this);
    this.setCompletedTasks = this.setCompletedTasks.bind(this);
    this.toggleShowCompleted = this.toggleShowCompleted.bind(this);
    this.componentWillReceiveProps = this.componentWillReceiveProps.bind(this);

    this.setCompletedTasks();
  }

  componentWillReceiveProps(nextProps) {
    this.setCompletedTasks(nextProps.tasks);
    this.setSelectedTask(null);
  }

  setCompletedTasks(newTasks) {
    this.tasksCompleted = [];
    this.tasksOpen = [];

    let tasks;

    if (newTasks) {
      tasks = newTasks;
    } else {
      ({ tasks } = this.props);
    }

    tasks.forEach((task) => {
      if (task.done === true) {
        this.tasksCompleted.push(task);
      } else {
        this.tasksOpen.push(task);
      }
    });
  }

  setSelectedTask(taskId) {
    if (this.state.selected === taskId || taskId === null) {
      this.setState({
        selected: null,
      });
    } else {
      this.setState({
        selected: taskId,
      });
    }
  }

  toggleShowCompleted() {
    this.showCompleted = !this.showCompleted;
    this.forceUpdate();
  }

  buildTask(task) {
    return (
      <Task
        key={task._id}
        task={task}
        selected={this.state.selected}
        setSelected={this.setSelectedTask}
        setCompleted={this.setCompletedTasks}
      />
    );
  }

  render() {
    return (
      <div>
        <TaskCounter
          numberOpen={this.tasksOpen.length}
          numberDone={this.tasksCompleted.length}
        />
        <div className="tasks">
          <h1 className="tasks__hdl"> Offene Aufgaben </h1>
          <ul className="tasks__list">
            {this.tasksOpen.map(this.buildTask)}
          </ul>
        </div>
        <div className="tasks">
          <button
            className="btn tasks__show-completed"
            onClick={this.toggleShowCompleted}
          >
            {
              this.showCompleted
              ? 'Erledigte Aufgaben ausblenden'
              : 'Erledigte Aufgaben anzeigen'
            }
          </button>
          <div
            className={
              this.showCompleted
              ? 'tasks__completed-wrapper tasks__completed-wrapper--active'
              : 'tasks__completed-wrapper'
            }
          >
            <h1 className="tasks__hdl">
              Erledigte Aufgaben
            </h1>
            <ul className="tasks__list">
              {this.tasksCompleted.map(this.buildTask)}
            </ul>
          </div>
        </div>
        <TaskListAddTask />
      </div>
    );
  }
}

const task = PropTypes.shape({
  content: PropTypes.string.isRequired,
  done: PropTypes.bool,
});

TaskList.propTypes = {
  tasks: PropTypes.arrayOf(task).isRequired,
};

export default TaskList;
