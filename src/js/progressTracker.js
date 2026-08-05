/**
 * LocalStorage Manager for Cloud Security Timetable, Gamification & Progress Tracker
 * DETERMINISTIC XP & LEVEL CALCULATION ENGINE (BUG-FREE)
 */

const STORAGE_KEY = "cloudsec_playbook_tracker_v1";

export class ProgressTracker {
  constructor() {
    this.state = this.loadState();
  }

  loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        console.error("Failed to parse progress state from localStorage", e);
      }
    }
    return this.getDefaultState();
  }

  getDefaultState() {
    return {
      completedDays: {}, // dayId: { study: true, lab: true, revision: true, notes: "..." }
      completedProjects: {}, // projectId: "Not Started" | "In Progress" | "Completed"
      certifications: {
        "az-500": "Not Started",
        "sc-100": "Not Started"
      },
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0]
    };
  }

  saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  toggleTask(dayId, taskType) {
    if (!this.state.completedDays[dayId]) {
      this.state.completedDays[dayId] = { study: false, lab: false, revision: false, notes: "" };
    }

    const isCurrentlyChecked = this.state.completedDays[dayId][taskType];
    const newCheckedState = !isCurrentlyChecked;
    this.state.completedDays[dayId][taskType] = newCheckedState;

    this.updateStreak();
    this.saveState();
    return newCheckedState;
  }

  saveDayNotes(dayId, notesText) {
    if (!this.state.completedDays[dayId]) {
      this.state.completedDays[dayId] = { study: false, lab: false, revision: false, notes: "" };
    }
    this.state.completedDays[dayId].notes = notesText;
    this.saveState();
  }

  setProjectStatus(projectId, status) {
    this.state.completedProjects[projectId] = status;
    this.saveState();
  }

  setCertStatus(certId, status) {
    if (!this.state.certifications) {
      this.state.certifications = {};
    }
    this.state.certifications[certId] = status;
    this.saveState();
  }

  updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    if (this.state.lastActiveDate !== today) {
      this.state.streak = (this.state.streak || 0) + 1;
      this.state.lastActiveDate = today;
    }
  }

  getDayProgress(dayId) {
    const dayData = this.state.completedDays[dayId];
    if (!dayData) return 0;
    let count = 0;
    if (dayData.study) count++;
    if (dayData.lab) count++;
    if (dayData.revision) count++;
    return Math.round((count / 3) * 100);
  }

  /**
   * Deterministically calculates total XP from actual checked state
   * Eliminates duplicate XP inflation bugs when toggling checkboxes on/off
   */
  calculateTotalXP() {
    let xp = 0;

    // 1. Task XP
    Object.keys(this.state.completedDays).forEach(dayId => {
      const dayData = this.state.completedDays[dayId];
      if (dayData) {
        if (dayData.study) xp += 50;
        if (dayData.lab) xp += 100;
        if (dayData.revision) xp += 50;
      }
    });

    // 2. Project XP (+250 XP per completed project)
    if (this.state.completedProjects) {
      Object.keys(this.state.completedProjects).forEach(pId => {
        if (this.state.completedProjects[pId] === "Completed") {
          xp += 250;
        }
      });
    }

    // 3. Certification XP (+500 XP per certified exam)
    if (this.state.certifications) {
      Object.keys(this.state.certifications).forEach(cId => {
        if (this.state.certifications[cId] === "Certified") {
          xp += 500;
        }
      });
    }

    return xp;
  }

  getOverallMetrics(totalDaysCount = 120, totalProjectsCount = 15) {
    let finishedDays = 0;
    Object.keys(this.state.completedDays).forEach(dayId => {
      const d = this.state.completedDays[dayId];
      if (d.study && d.lab && d.revision) {
        finishedDays++;
      }
    });

    let finishedProjects = 0;
    if (this.state.completedProjects) {
      Object.keys(this.state.completedProjects).forEach(pId => {
        if (this.state.completedProjects[pId] === "Completed") {
          finishedProjects++;
        }
      });
    }

    let certifiedCount = 0;
    if (this.state.certifications) {
      Object.keys(this.state.certifications).forEach(cId => {
        if (this.state.certifications[cId] === "Certified") {
          certifiedCount++;
        }
      });
    }

    const daysPercentage = (finishedDays / totalDaysCount) * 100;
    const projectsPercentage = (finishedProjects / totalProjectsCount) * 100;

    const readinessScore = Math.round(
      (finishedDays / totalDaysCount) * 40 + 
      (finishedProjects / totalProjectsCount) * 40 + 
      (certifiedCount / 2) * 20
    );

    // Deterministic XP & Level calculation
    const xp = this.calculateTotalXP();
    const level = Math.floor(xp / 500) + 1;
    const levelProgress = Math.round(((xp % 500) / 500) * 100);

    return {
      finishedDays,
      totalDays: totalDaysCount,
      daysPercentage: Math.round(daysPercentage),
      finishedProjects,
      totalProjects: totalProjectsCount,
      projectsPercentage: Math.round(projectsPercentage),
      certifiedCount,
      readinessScore: Math.min(100, readinessScore),
      streak: this.state.streak || 1,
      xp,
      level,
      levelProgress
    };
  }

  exportData() {
    return JSON.stringify(this.state, null, 2);
  }

  importData(jsonString) {
    try {
      this.state = JSON.parse(jsonString);
      this.saveState();
      return true;
    } catch (e) {
      return false;
    }
  }

  resetAll() {
    this.state = this.getDefaultState();
    this.saveState();
  }
}
