# Calculation Issue Label Priorities

- We look at every organization's repository and store all issues for that project.
- Then, we filter out all issues, which are **labeled** and which are **assigned** to a project member.
  - Issues have default labels such as `bug`, `enhancement` or `documentation`.
  - Also, organization's own labels are taken into account.
- For every project member, we want to monitor, how much time does a completion of a certain kind of ticket (i.e. tickets with the same label) takes **in average**, expressed in time intervals `days`, `weeks`, `sprints` and `months`:

  - The calculation period is ranged from the earliest creation date until the current date of computation, as not every issue is closed yet.
  - The issues are then divided among the time intervals `days`, `weeks`, `sprints` and `months` relating to their duration time.
  - Assume `Dev1` has the following ticket timeline, where the first row is the _creation date_ and the last row is the _closing date_:

    - | bug      | feature  | bug      |
      | -------- | -------- | -------- |
      | ticket 1 | ticket 2 | ticket 3 |
      | 01.10.21 | 01.10.21 | 03.10.21 |
      | 14.10.21 | 21.10.21 | -        |
    - Let's assume, the compuation date is the **30.10.21**, then the period is from **01.10.21 - 30.10.21**.
    - This leads to intervals of **30 days**, **4 weeks**, **2 sprints** and **1 month**.

    - To calculate e.g. the **bug avarage** for `Dev1`, we add 14 days for _ticket 1_ and 27 days for _ticket 3_ and got `(14+27)/2 = 20.5` days per bug fix or we add 2 weeks for _(ticket 1 & ticket 3)_ and again 2 weeks for _(ticket 1 & ticket 3)_ and 2 times 1 week for _ticket 3_ and get `(2+2+1+1)/2 = 3` weeks per bug fix.

  - The same calculation holds for the other labels and time intervals.

- Then, the **average completion time** for each ticket label for the **whole organization** or **one project** is being calculated; all _average comletition times_ per project member per label kind are being summed up and set in relation to a _weight propotional to ticket amount of the project member_.
