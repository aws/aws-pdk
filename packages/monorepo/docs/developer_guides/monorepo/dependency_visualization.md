# Visualize your dependency graph

As your codebase grows, the number of sub-packages will likely increase and it is sometimes useful to be able to visualize your project and task dependencies. To do this, simply run `pdk graph` from the root of the monorepo which will open a browser for you.

You will now be able to visualize your project level dependencies (i.e. package a depends on package b) along with your task level (order in which tasks are performed i.e. build) dependencies.

=== "Project Level"

    <img src="../../assets/images/project_graph.png" width="800" />

=== "Task Level"

    <img src="../../assets/images/task_graph.png" width="800" />
