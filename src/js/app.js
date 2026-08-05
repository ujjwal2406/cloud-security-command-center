import { COURSE_MODULES, ACHIEVEMENTS_LIST, CERTIFICATIONS_LIST, DAYS_CURRICULUM, PROJECTS_LIST, INTERVIEW_CARDS } from './playbookData.js';
import { ProgressTracker } from './progressTracker.js';

class TimetableApp {
  constructor() {
    this.tracker = new ProgressTracker();
    this.activeTab = 'timetable';
    this.selectedCourse = 'all';
    this.searchQuery = '';
    this.audioEnabled = true;
    this.audioCtx = null;
    
    this.initElements();
    this.bindEvents();
    this.render();
  }

  initElements() {
    // Metrics
    this.daysCountEl = document.getElementById('metricDaysCount');
    this.projectsCountEl = document.getElementById('metricProjectsCount');
    this.certsCountEl = document.getElementById('metricCertsCount');
    this.readinessScoreEl = document.getElementById('metricReadinessScore');
    this.streakCountEl = document.getElementById('metricStreakCount');
    this.progressBarFillEl = document.getElementById('progressBarFill');

    // Gamification Level & XP
    this.levelBadgeEl = document.getElementById('userLevelBadge');
    this.xpTextEl = document.getElementById('userXpText');
    this.xpBarFillEl = document.getElementById('userXpBarFill');
    this.toastContainer = document.getElementById('toastContainer');
    this.heatmapGridEl = document.getElementById('heatmapGrid');
    this.btnAudioToggle = document.getElementById('btnAudioToggle');

    // Filters
    this.courseFilterSelect = document.getElementById('courseFilterSelect');
    this.searchInput = document.getElementById('searchInput');

    // Panels
    this.timetablePanel = document.getElementById('panelTimetable');
    this.projectsPanel = document.getElementById('panelProjects');
    this.certsPanel = document.getElementById('panelCerts');
    this.coursesPanel = document.getElementById('panelCourses');
    this.interviewPanel = document.getElementById('panelInterview');

    // Navigation Tabs
    this.tabButtons = document.querySelectorAll('.tab-btn');
  }

  bindEvents() {
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');
        this.setActiveTab(targetTab);
      });
    });

    if (this.courseFilterSelect) {
      this.courseFilterSelect.addEventListener('change', (e) => {
        this.selectedCourse = e.target.value;
        this.renderTimetable();
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderCurrentTab();
      });
    }

    if (this.btnAudioToggle) {
      this.btnAudioToggle.addEventListener('click', () => {
        this.audioEnabled = !this.audioEnabled;
        this.btnAudioToggle.textContent = this.audioEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
      });
    }

    const btnExport = document.getElementById('btnExportProgress');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(this.tracker.exportData());
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "cloudsec_progress_backup.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      });
    }
  }

  playChime(isChecked) {
    if (!this.audioEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;
      if (isChecked) {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      } else {
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      }

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      // Audio permission error
    }
  }

  showToast(message, icon = "🎉") {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span style="font-size: 1.5rem;">${icon}</span> <span>${message}</span>`;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4200);
  }

  triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#00f2fe', '#00ff87', '#bf5af2', '#ffb703', '#4facfe'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 14 - 5,
        size: Math.random() * 9 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 100
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        if (p.life > 0) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.22;
          p.life -= 2;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      });
      if (alive) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    animate();
  }

  setActiveTab(tabName) {
    this.activeTab = tabName;
    this.tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`panel${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (activePanel) {
      activePanel.classList.add('active');
    }

    this.renderCurrentTab();
  }

  renderCurrentTab() {
    if (this.activeTab === 'timetable') this.renderTimetable();
    if (this.activeTab === 'projects') this.renderProjects();
    if (this.activeTab === 'certs') this.renderCerts();
    if (this.activeTab === 'courses') this.renderCourses();
    if (this.activeTab === 'interview') this.renderInterview();
    this.renderHeatmap();
    this.updateMetrics();
  }

  updateMetrics() {
    const metrics = this.tracker.getOverallMetrics(120, PROJECTS_LIST.length);
    
    if (this.daysCountEl) this.daysCountEl.textContent = `${metrics.finishedDays} / 120`;
    if (this.projectsCountEl) this.projectsCountEl.textContent = `${metrics.finishedProjects} / ${PROJECTS_LIST.length}`;
    if (this.certsCountEl) this.certsCountEl.textContent = `${metrics.certifiedCount} / 2`;
    if (this.readinessScoreEl) this.readinessScoreEl.textContent = `${metrics.readinessScore}%`;
    if (this.streakCountEl) this.streakCountEl.textContent = `${metrics.streak} Days`;
    if (this.progressBarFillEl) this.progressBarFillEl.style.width = `${metrics.readinessScore}%`;

    // Gamification
    if (this.levelBadgeEl) this.levelBadgeEl.textContent = `LEVEL ${metrics.level}`;
    if (this.xpTextEl) this.xpTextEl.textContent = `${metrics.xp} XP total • ${metrics.levelProgress}% to Level ${metrics.level + 1}`;
    if (this.xpBarFillEl) this.xpBarFillEl.style.width = `${metrics.levelProgress}%`;
  }

  renderHeatmap() {
    if (!this.heatmapGridEl) return;
    let html = '';
    for (let dayNum = 1; dayNum <= 120; dayNum++) {
      const progress = this.tracker.getDayProgress(dayNum);
      let activeClass = '';
      if (progress > 0 && progress < 100) activeClass = 'active-1';
      if (progress === 100) activeClass = 'active-3';

      html += `<div class="heatmap-cell ${activeClass}" title="Day ${dayNum}: ${progress}% completed"></div>`;
    }
    this.heatmapGridEl.innerHTML = html;
  }

  renderTimetable() {
    if (!this.timetablePanel) return;

    let filteredDays = DAYS_CURRICULUM;
    
    if (this.selectedCourse !== 'all') {
      filteredDays = filteredDays.filter(d => d.courseId === parseInt(this.selectedCourse));
    }

    if (this.searchQuery) {
      filteredDays = filteredDays.filter(d => 
        d.title.toLowerCase().includes(this.searchQuery) ||
        d.topic.toLowerCase().includes(this.searchQuery) ||
        d.lab.toLowerCase().includes(this.searchQuery) ||
        (d.udemyRef && d.udemyRef.toLowerCase().includes(this.searchQuery)) ||
        d.category.toLowerCase().includes(this.searchQuery)
      );
    }

    const groupedByCourse = {};
    filteredDays.forEach(day => {
      const cId = day.courseId || 1;
      if (!groupedByCourse[cId]) {
        groupedByCourse[cId] = [];
      }
      groupedByCourse[cId].push(day);
    });

    let html = '';

    Object.keys(groupedByCourse).forEach(cId => {
      const courseObj = COURSE_MODULES.find(m => m.id === parseInt(cId));
      const days = groupedByCourse[cId];

      html += `
        <div class="month-group">
          <div class="month-title">
            <span>📺 ${courseObj ? courseObj.title : `Course ${cId}`}</span>
            <span style="font-size: 0.8rem; font-weight: normal; color: var(--color-azure); margin-left: auto;">
              ${courseObj ? courseObj.daysRange : ''}
            </span>
          </div>
          <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1.1rem;">
            <strong>Course Focus & Sections:</strong> ${courseObj ? courseObj.focus : ''}
          </div>
          <div class="days-grid">
            ${days.map(day => this.createDayCardHTML(day)).join('')}
          </div>
        </div>
      `;
    });

    if (filteredDays.length === 0) {
      html = `
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
          🔍 No study days matching search query "${this.searchQuery}". Try adjusting filters.
        </div>
      `;
    }

    this.timetablePanel.innerHTML = html;
    this.bindDayCardEvents();
  }

  createDayCardHTML(day) {
    const dayData = this.tracker.state.completedDays[day.day] || { study: false, lab: false, revision: false, notes: "" };
    const dayProgress = this.tracker.getDayProgress(day.day);
    const isFullyCompleted = dayProgress === 100;

    return `
      <div class="day-card ${isFullyCompleted ? 'completed' : ''}" data-day="${day.day}">
        <div>
          <div class="day-card-header">
            <span class="day-badge ${day.category === 'Project' ? 'project' : ''}">${day.category === 'Certification' ? '🏆 CERT EXAM' : `DAY ${day.day} • W${day.week}`}</span>
            <span style="font-size: 0.8rem; font-weight: 800; color: ${isFullyCompleted ? 'var(--color-emerald)' : 'var(--text-secondary)'};">
              ${isFullyCompleted ? '✅ COMPLETED (+200 XP)' : `${dayProgress}% DONE`}
            </span>
          </div>
          
          <div class="day-title">${day.title}</div>
          
          ${day.udemyRef ? `
            <div style="font-size: 0.8rem; background: rgba(0, 242, 254, 0.12); border: 1px solid var(--border-glow-azure); border-radius: 0.4rem; padding: 0.4rem 0.65rem; color: var(--color-azure); margin-bottom: 0.75rem; font-weight: 700;">
              📺 ${day.udemyRef}
            </div>
          ` : ''}

          <div class="day-meta">
            <strong>Topic:</strong> ${day.topic}<br>
            <strong>Target Outcome:</strong> ${day.outcome}
          </div>

          <div class="day-task-box">
            <div class="task-item ${dayData.study ? 'checked' : ''}" data-day="${day.day}" data-task="study">
              <input type="checkbox" class="task-checkbox" ${dayData.study ? 'checked' : ''}>
              <span class="task-label">📖 Watch Section Video (${day.hours}h) [+50 XP]</span>
            </div>
            
            <div class="task-item ${dayData.lab ? 'checked' : ''}" data-day="${day.day}" data-task="lab">
              <input type="checkbox" class="task-checkbox" ${dayData.lab ? 'checked' : ''}>
              <span class="task-label">🧪 Hands-On Lab: ${day.lab} [+100 XP]</span>
            </div>

            <div class="task-item ${dayData.revision ? 'checked' : ''}" data-day="${day.day}" data-task="revision">
              <input type="checkbox" class="task-checkbox" ${dayData.revision ? 'checked' : ''}>
              <span class="task-label">🔄 Spaced Revision: ${day.revision} [+50 XP]</span>
            </div>
          </div>
        </div>

        <div>
          <textarea 
            class="notes-area" 
            placeholder="Add key notes, commands, or takeaways for Day ${day.day}..."
            data-day="${day.day}"
          >${dayData.notes || ''}</textarea>
        </div>
      </div>
    `;
  }

  bindDayCardEvents() {
    document.querySelectorAll('.task-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const dayId = e.currentTarget.getAttribute('data-day');
        const taskType = e.currentTarget.getAttribute('data-task');
        
        const isCheckedNow = this.tracker.toggleTask(dayId, taskType);
        this.playChime(isCheckedNow);

        if (isCheckedNow) {
          const dayProgress = this.tracker.getDayProgress(dayId);
          if (dayProgress === 100) {
            this.triggerConfetti();
            this.showToast(`Day ${dayId} 100% Mastered! +200 XP!`, "🔥");
          } else {
            const xpGained = taskType === 'lab' ? 100 : 50;
            this.showToast(`Task Checked! +${xpGained} XP!`, "⚡");
          }
        } else {
          const xpRemoved = taskType === 'lab' ? 100 : 50;
          this.showToast(`Task Unchecked. -${xpRemoved} XP`, "⚠️");
        }

        this.renderCurrentTab();
      });
    });

    document.querySelectorAll('.notes-area').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const dayId = e.target.getAttribute('data-day');
        this.tracker.saveDayNotes(dayId, e.target.value);
      });
    });
  }

  renderProjects() {
    if (!this.projectsPanel) return;

    let projects = PROJECTS_LIST;
    if (this.searchQuery) {
      projects = projects.filter(p => 
        p.title.toLowerCase().includes(this.searchQuery) ||
        p.category.toLowerCase().includes(this.searchQuery) ||
        p.tools.some(t => t.toLowerCase().includes(this.searchQuery))
      );
    }

    const html = `
      <div class="projects-grid">
        ${projects.map(p => {
          const currentStatus = this.tracker.state.completedProjects[p.id] || "Not Started";
          return `
            <div class="project-card">
              <div>
                <div class="project-header">
                  <span class="day-badge">PROJECT ${p.id}</span>
                  <select class="project-status-select" data-project="${p.id}">
                    <option value="Not Started" ${currentStatus === 'Not Started' ? 'selected' : ''}>🔴 Not Started</option>
                    <option value="In Progress" ${currentStatus === 'In Progress' ? 'selected' : ''}>🟡 In Progress</option>
                    <option value="Completed" ${currentStatus === 'Completed' ? 'selected' : ''}>🟢 Completed (+250 XP)</option>
                  </select>
                </div>
                
                <div class="project-title">${p.title}</div>
                <div style="font-size: 0.825rem; color: var(--color-azure); margin-top: 0.2rem;">
                  GitHub Repo: <code>${p.repo}</code>
                </div>

                <div style="font-size: 0.8rem; color: var(--color-emerald); margin-top: 0.35rem; font-weight: 700;">
                  📺 Aligned Section: ${p.alignedCourse}
                </div>

                <div class="project-tools">
                  ${p.tools.map(t => `<span class="tool-tag">${t}</span>`).join('')}
                </div>

                <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
                  ${p.description}
                </p>

                <div class="resume-bullet-box">
                  <strong>Expected Resume Bullet:</strong><br>
                  "${p.resumeBullet}"
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.projectsPanel.innerHTML = html;

    document.querySelectorAll('.project-status-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const projectId = e.target.getAttribute('data-project');
        this.tracker.setProjectStatus(projectId, e.target.value);
        if (e.target.value === "Completed") {
          this.triggerConfetti();
          this.showToast(`Project ${projectId} Completed & Pushed! +250 XP!`, "🛡️");
        } else {
          this.showToast(`Project ${projectId} status updated.`, "ℹ️");
        }
        this.updateMetrics();
      });
    });
  }

  renderCerts() {
    if (!this.certsPanel) return;

    const certs = CERTIFICATIONS_LIST;
    const html = `
      <div class="projects-grid">
        ${certs.map(c => {
          const currentStatus = (this.tracker.state.certifications && this.tracker.state.certifications[c.id]) || "Not Started";
          return `
            <div class="project-card" style="border-color: ${currentStatus === 'Certified' ? 'var(--color-emerald)' : 'var(--border-glass)'}">
              <div>
                <div class="project-header">
                  <span class="day-badge project">${c.code} • ${c.priority}</span>
                  <select class="cert-status-select" data-cert="${c.id}">
                    <option value="Not Started" ${currentStatus === 'Not Started' ? 'selected' : ''}>🔴 Not Started</option>
                    <option value="In Study" ${currentStatus === 'In Study' ? 'selected' : ''}>🟡 In Preparation</option>
                    <option value="Practice Test Passed" ${currentStatus === 'Practice Test Passed' ? 'selected' : ''}>🔵 Practice Test Passed</option>
                    <option value="Certified" ${currentStatus === 'Certified' ? 'selected' : ''}>🟢 Certified (+500 XP)</option>
                  </select>
                </div>

                <div class="project-title">${c.title}</div>
                <div style="font-size: 0.85rem; color: var(--color-azure); margin-top: 0.35rem;">
                  🗓️ Target Timeline: <strong>${c.targetMonth}</strong> • Min Score: ${c.passingScore}
                </div>

                <div style="font-size: 0.8rem; color: var(--color-emerald); margin-top: 0.35rem; font-weight: 700;">
                  📺 Aligned Course: ${c.udemyCourse}
                </div>

                <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.85rem;">
                  ${c.description}
                </p>

                <div class="resume-bullet-box" style="margin-top: 1.1rem;">
                  <strong>Exam Domain Weights:</strong>
                  <ul style="margin-left: 1.2rem; margin-top: 0.45rem; line-height: 1.65; font-size: 0.825rem;">
                    ${c.domains.map(d => `<li><strong>${d.name}:</strong> ${d.weight}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.certsPanel.innerHTML = html;

    document.querySelectorAll('.cert-status-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const certId = e.target.getAttribute('data-cert');
        this.tracker.setCertStatus(certId, e.target.value);
        if (e.target.value === "Certified") {
          this.triggerConfetti();
          this.showToast(`Passed ${certId.toUpperCase()} Certification Exam! +500 XP!`, "🏆");
        }
        this.updateMetrics();
      });
    });
  }

  renderCourses() {
    if (!this.coursesPanel) return;

    const html = `
      <div class="projects-grid">
        ${COURSE_MODULES.map(c => `
          <div class="project-card" style="border-color: ${c.status === 'Owned' ? 'var(--color-emerald)' : 'var(--border-glow-azure)'}">
            <div>
              <div class="project-header">
                <span class="day-badge ${c.status === 'Owned' ? '' : 'project'}">${c.status === 'Owned' ? 'OWNED COURSE' : 'RECOMMENDED GAP-FILL'}</span>
                <span style="font-size: 0.85rem; font-weight: 800; color: var(--color-azure);">${c.daysRange}</span>
              </div>
              
              <div class="project-title" style="margin-top: 0.5rem;">${c.title}</div>

              <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
                <strong>Instructor:</strong> ${c.instructor} • <strong>Total Sections:</strong> ${c.totalSections}
              </div>

              <div class="resume-bullet-box" style="margin-top: 1.1rem;">
                <strong>Exact Section-by-Section Syllabus:</strong>
                <ul style="margin-left: 1.2rem; margin-top: 0.5rem; line-height: 1.6; font-size: 0.825rem;">
                  ${c.sections.map(s => `<li>${s.title}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.coursesPanel.innerHTML = html;
  }

  renderInterview() {
    if (!this.interviewPanel) return;

    let cards = INTERVIEW_CARDS;
    if (this.searchQuery) {
      cards = cards.filter(c => 
        c.question.toLowerCase().includes(this.searchQuery) ||
        c.answer.toLowerCase().includes(this.searchQuery) ||
        c.domain.toLowerCase().includes(this.searchQuery)
      );
    }

    const html = `
      <div class="qa-grid">
        ${cards.map(c => `
          <div class="qa-card">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.6rem;">
              <span class="day-badge">${c.domain}</span>
              <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">Q#${c.id}</span>
            </div>
            <div class="qa-question">Q: ${c.question}</div>
            <div class="qa-answer">${c.answer}</div>
          </div>
        `).join('')}
      </div>
    `;

    this.interviewPanel.innerHTML = html;
  }

  render() {
    this.renderCurrentTab();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new TimetableApp();
});
