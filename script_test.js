} catch(e){}
});// PHASE 7: SMART WELLNESS INSIGHTS
// =====================================================

let currentInsights = [];

async function fetchWellnessInsights() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const [insightsRes, trendsRes, patternsRes] = await Promise.all([
            fetch('/api/wellness-insights', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/wellness-insights/trends', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/wellness-insights/patterns', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        let allInsights = [];
        
        if (insightsRes.ok) {
            const data = await insightsRes.json();
            allInsights = allInsights.concat(data.insights || []);
        }
        if (trendsRes.ok) {
            const data = await trendsRes.json();
            allInsights = allInsights.concat(data.trends || []);
        }
        if (patternsRes.ok) {
            const data = await patternsRes.json();
            allInsights = allInsights.concat(data.patterns || []);
        }

        currentInsights = allInsights;
        
        // Update Dashboard Widget
        const dashInsight = document.getElementById('dashTopInsight');
        if (dashInsight) {
            if (allInsights.length > 0) {
                dashInsight.textContent = allInsights[0].description;
            } else {
                dashInsight.textContent = "Keep logging your mood and habits to generate smart insights.";
            }
        }

        renderInsights(allInsights);
        
    } catch (error) {
        console.error('Error fetching wellness insights:', error);
        const container = document.getElementById('insightsContainer');
        if (container) container.innerHTML = '<div class="iv-card" style="color:var(--danger);">Failed to load insights.</div>';
    }
}

function renderInsights(insights) {
    const container = document.getElementById('insightsContainer');
    if (!container) return;
    
    if (insights.length === 0) {
        container.innerHTML = `
            <div class="iv-card" style="grid-column: 1 / -1; text-align:center; padding:40px;">
                <div style="font-size:40px; margin-bottom:16px;">🌱</div>
                <h3 style="font-size:20px; font-weight:700;">Not enough data yet</h3>
                <p style="color:var(--text-muted); max-width:400px; margin:0 auto;">
                    We need a bit more data to identify patterns. Keep logging your mood, habits, and journals!
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = insights.map(insight => {
        let icon = '💡';
        if (insight.category.includes('MOOD')) icon = '😌';
        if (insight.category.includes('HABIT')) icon = '🔥';
        if (insight.category.includes('JOURNAL')) icon = '📝';
        if (insight.category.includes('TREND') || insight.category.includes('WELLNESS')) icon = '📊';
        
        return `
            <div class="iv-card" style="display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                        <span style="background:var(--primary-light); color:var(--primary); font-size:11px; font-weight:700; padding:4px 8px; border-radius:12px;">${insight.category}</span>
                        ${insight.importance === 'HIGH' ? '<span style="color:#ef4444; font-size:12px; font-weight:700;">HIGH IMPORTANCE</span>' : ''}
                    </div>
                    <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:12px;">
                        <div style="font-size:24px;">${icon}</div>
                        <h3 style="font-size:18px; font-weight:700; margin:0;">${insight.title}</h3>
                    </div>
                    <p style="color:var(--text-dark); margin-bottom:16px; font-size:15px; line-height:1.5;">${insight.description}</p>
                </div>
                <div style="background:var(--bg-color); padding:12px; border-radius:12px; border:1px solid var(--border-color);">
                    <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">Recommendation</div>
                    <p style="margin:0; font-size:14px; color:var(--primary);">${insight.recommendation}</p>
                </div>
            </div>
        `;
    }).join('');
}

function filterInsights(category) {
    if (category === 'ALL') {
        renderInsights(currentInsights);
    } else {
        const filtered = currentInsights.filter(i => i.category.includes(category));
        renderInsights(filtered);
    }
}

// =====================================================
// PHASE 8: PERSONALIZED RECOMMENDATIONS
// =====================================================

let currentRecommendations = [];

async function fetchRecommendations() {
    const token = localStorage.getItem('innerVoiceToken') || localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch('/api/recommendations', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            currentRecommendations = data.recommendations || [];
            
            // Update Dashboard Widget
            const dashRec = document.getElementById('dashTopRecommendation');
            const dashRecPriority = document.getElementById('dashRecPriority');
            if (dashRec && dashRecPriority) {
                if (currentRecommendations.length > 0) {
                    const topRec = currentRecommendations[0];
                    dashRec.textContent = topRec.action;
                    dashRecPriority.textContent = topRec.priority.toUpperCase();
                    
                    if (topRec.priority === 'HIGH') {
                        dashRecPriority.style.background = '#fee2e2';
                        dashRecPriority.style.color = '#b91c1c';
                    } else if (topRec.priority === 'MEDIUM') {
                        dashRecPriority.style.background = '#fef3c7';
                        dashRecPriority.style.color = '#b45309';
                    } else {
                        dashRecPriority.style.background = '#dcfce7';
                        dashRecPriority.style.color = '#166534';
                    }
                    dashRecPriority.style.display = 'inline-block';
                } else {
                    dashRec.textContent = "Keep logging your mood and habits to receive personalized recommendations.";
                    dashRecPriority.style.display = 'none';
                }
            }

            renderRecommendations(currentRecommendations);
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        const container = document.getElementById('recommendationsContainer');
        if (container) container.innerHTML = '<div class="day-empty-state" style="color:var(--danger);">Failed to load recommendations.</div>';
    }
}

function renderRecommendations(recommendations) {
    const container = document.getElementById('recommendationsContainer');
    if (!container) return;
    
    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="day-empty-state" style="grid-column: 1 / -1; padding:40px; background:white; border-radius:12px; text-align:center;">
                <div style="font-size:40px; margin-bottom:16px;">🌱</div>
                <h3 style="font-size:20px; font-weight:700;">No Recommendations Yet</h3>
                <p style="color:var(--text-muted); max-width:400px; margin:0 auto;">
                    Your recommendations will become more personalized as you continue to log your mood, journal, and complete habits.
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recommendations.map(rec => {
        let priorityStyle = 'background:#dcfce7; color:#166534;'; // LOW
        if (rec.priority === 'HIGH') priorityStyle = 'background:#fee2e2; color:#b91c1c;';
        if (rec.priority === 'MEDIUM') priorityStyle = 'background:#fef3c7; color:#b45309;';
        
        let sectionTarget = '#dailyPlan';
        if (rec.category === 'Mood') sectionTarget = '#mood';
        if (rec.category === 'Journal') sectionTarget = '#journal';
        if (rec.category === 'Habit') sectionTarget = '#habitTrackerSection';
        if (rec.category === 'Focus') sectionTarget = '#focusMode';

        return `
            <div class="iv-card" style="display:flex; flex-direction:column; justify-content:space-between; background:white; transition:transform 0.2s; box-shadow:0 8px 30px rgba(0,0,0,0.05);">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                        <span style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">${rec.category}</span>
                        <span style="font-size:11px; font-weight:700; padding:4px 8px; border-radius:12px; ${priorityStyle}">${rec.priority}</span>
                    </div>
                    <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:12px;">
                        <div style="font-size:24px;">${rec.icon || '✨'}</div>
                        <h3 style="font-size:18px; font-weight:700; margin:0;">${rec.title}</h3>
                    </div>
                    <p style="color:var(--text-dark); margin-bottom:16px; font-size:14px; line-height:1.5;">${rec.reasoning}</p>
                </div>
                <div style="margin-top:auto;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px; font-size:13px; color:var(--text-muted); font-weight:600;">
                        <span>⏱️ ${rec.estimated_minutes} min</span>
                    </div>
                    <a href="${sectionTarget}" onclick="if(typeof showSection === 'function') showSection('${sectionTarget}')" class="iv-btn iv-btn-primary" style="display:block; text-align:center; text-decoration:none; padding:12px; box-sizing:border-box;">
                        ${rec.action}
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

function filterRecs(priority) {
    if (priority === 'ALL') {
        renderRecommendations(currentRecommendations);
    } else {
        const filtered = currentRecommendations.filter(r => r.priority === priority);
        renderRecommendations(filtered);
    }
}

/* =====================================================
   PHASE 9: WELLNESS JOURNEY TIMELINE
===================================================== */
let currentWellnessJourney = [];
let currentJourneyFilter = 'ALL';

async function loadWellnessJourney() {
    const token = getToken();
    if (!token) return;

    const range = document.getElementById('journeyRangeSelect')?.value || '30';
    let url = BACKEND_URL + "/api/wellness-journey";
    
    if (range !== 'all') {
        const today = new Date();
        const fromDate = new Date();
        fromDate.setDate(today.getDate() - parseInt(range, 10));
        url += `?from=${fromDate.toISOString().split('T')[0]}&to=${today.toISOString().split('T')[0]}`;
    }

    try {
        const res = await fetch(url, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();
        
        if (data.success) {
            currentWellnessJourney = data.events || [];
            renderJourneyTimeline();
            updateDashboardJourneyWidget(currentWellnessJourney);
        }
    } catch (err) {
        console.error("Failed to fetch wellness journey:", err);
    }
}

function updateDashboardJourneyWidget(events) {
    const dashContainer = document.getElementById('dashJourneyContainer');
    if (!dashContainer) return;

    if (!events || events.length === 0) {
        dashContainer.innerHTML = `<p style="font-size:13px; color:var(--text-muted); margin:0;">No journey events in this range.</p>`;
        return;
    }

    const latest = events.slice(0, 3);
    dashContainer.innerHTML = latest.map(e => `
        <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:24px; height:24px; border-radius:50%; background:var(--primary-light); display:flex; align-items:center; justify-content:center; font-size:12px;">
                ${e.icon}
            </div>
            <div style="flex:1; min-width:0;">
                <p style="margin:0; font-size:13px; font-weight:600; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.title}</p>
                <p style="margin:0; font-size:11px; color:var(--text-muted);">${new Date(e.date).toLocaleDateString('en-IN', {month:'short', day:'numeric'})}</p>
            </div>
        </div>
    `).join('');
}

function filterJourney(type, btnEl) {
    currentJourneyFilter = type;
    document.querySelectorAll('.journey-filter-btn').forEach(btn => btn.classList.remove('iv-btn-primary', 'iv-btn-secondary'));
    document.querySelectorAll('.journey-filter-btn').forEach(btn => btn.classList.add('iv-btn-secondary'));
    
    if (btnEl) {
        btnEl.classList.remove('iv-btn-secondary');
        btnEl.classList.add('iv-btn-primary');
    }
    
    renderJourneyTimeline();
}

function renderJourneyTimeline() {
    const container = document.getElementById('journeyEventsList');
    if (!container) return;

    let events = currentWellnessJourney;

    if (currentJourneyFilter !== 'ALL') {
        events = events.filter(e => e.type === currentJourneyFilter);
    }

    const sortOrder = document.getElementById('journeySortSelect')?.value || 'desc';
    events.sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        return sortOrder === 'desc' ? db - da : da - db;
    });

    if (events.length === 0) {
        container.innerHTML = `<div class="day-empty-state" style="position:relative; z-index:2; background:#fff; border:1px solid var(--border-color); border-radius:12px; padding:24px; text-align:center;">
            No events found in this range. Keep building your journey! 🌱
        </div>`;
        return;
    }

    container.innerHTML = events.map(e => {
        const isHigh = e.importance === 'high';
        const d = new Date(e.date);
        const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' });

        return `
            <div style="display:flex; gap:16px; position:relative; align-items:flex-start;">
                <!-- Timeline Dot -->
                <div style="position:relative; z-index:2; margin-top:8px;">
                    <div style="width:20px; height:20px; border-radius:50%; background:${isHigh ? 'var(--primary)' : '#fff'}; border:4px solid ${isHigh ? '#e0e7ff' : 'var(--primary)'}; flex-shrink:0;"></div>
                </div>
                
                <!-- Event Card -->
                <div class="iv-card" style="flex:1; margin:0; padding:16px; background:${isHigh ? 'linear-gradient(to right, #f8fafc, #fff)' : '#fff'}; border:${isHigh ? '1px solid var(--primary)' : '1px solid var(--border-color)'}; box-shadow:${isHigh ? '0 4px 12px rgba(108, 99, 255, 0.08)' : 'none'}; border-radius:12px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="font-size:12px; font-weight:700; color:var(--primary); text-transform:uppercase; letter-spacing:0.5px;">${e.type.replace('_', ' ')}</span>
                        <span style="font-size:12px; color:var(--text-muted);">${dateStr}, ${timeStr}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="font-size:24px;">${e.icon}</div>
                        <div>
                            <h4 style="margin:0; font-size:16px; font-weight:700; color:var(--text-dark);">${e.title}</h4>
                            ${e.description ? `<p style="margin:4px 0 0 0; font-size:14px; color:var(--text-muted); line-height:1.4;">${e.description}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/* =====================================================
   PHASE 10: SMART NOTIFICATION & REMINDER CENTER
===================================================== */

let currentNotifications = [];

async function initNotifications() {
    const token = getToken();
    if (!token) return;
    await fetchNotifications('all');
}

async function fetchNotifications(filterStr = 'all') {
    const token = getToken();
    if (!token) return;

    try {
        const res = await fetch(`${BACKEND_URL}/api/notifications?filter=${filterStr}`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();
        if (data.success) {
            currentNotifications = data.notifications;
            updateNotifBadge(data.unread_count);
            renderNotifications();
            renderNotifDropdown();
            renderNotifDashboard();
        }
    } catch (err) {
        console.error("Error fetching notifications", err);
    }
}

function updateNotifBadge(count) {
    const badge = document.getElementById('notifBadge');
    const dashCount = document.getElementById('dashNotifUnreadCount');
    
    if (badge) {
        if (count > 0) {
            badge.style.display = 'inline-block';
            badge.textContent = count > 99 ? '99+' : count;
        } else {
            badge.style.display = 'none';
        }
    }
    
    if (dashCount) {
        dashCount.textContent = `${count} unread`;
    }
}

function toggleNotifDropdown() {
    const dd = document.getElementById('notifDropdown');
    if (dd) {
        dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
    }
}

function loadNotifications(filterStr, btnEl) {
    document.querySelectorAll('.notif-filter-btn').forEach(b => {
        b.classList.remove('iv-btn-primary');
        b.classList.add('iv-btn-secondary');
    });
    if (btnEl) {
        btnEl.classList.remove('iv-btn-secondary');
        btnEl.classList.add('iv-btn-primary');
    }
    fetchNotifications(filterStr);
}

function getPriorityStyle(priority) {
    if (priority === 'high') return 'color:#ef4444; background:#fee2e2; border:1px solid #fca5a5;';
    if (priority === 'medium') return 'color:#f59e0b; background:#fef3c7; border:1px solid #fcd34d;';
    return 'color:#3b82f6; background:#eff6ff; border:1px solid #bfdbfe;';
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;

    if (currentNotifications.length === 0) {
        list.innerHTML = `<div class="iv-card" style="text-align:center; padding:40px;">
            <div style="font-size:40px; margin-bottom:16px;">🔔</div>
            <h3 style="margin-bottom:8px;">You're all caught up!</h3>
            <p style="color:var(--text-muted);">No new wellness notifications right now.</p>
        </div>`;
        return;
    }

    list.innerHTML = currentNotifications.map(n => `
        <div class="iv-card" style="display:flex; gap:16px; align-items:flex-start; ${n.is_read ? 'opacity:0.7;' : 'border-left:4px solid var(--primary);'} cursor:pointer;" onclick="handleNotifClick(${n.id}, '${n.link}')">
            <div style="font-size:32px; padding-top:4px;">${n.icon}</div>
            <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span style="font-size:12px; font-weight:700; text-transform:uppercase; padding:2px 6px; border-radius:4px; ${getPriorityStyle(n.priority)}">${n.priority} Priority</span>
                    <span style="font-size:12px; color:var(--text-muted);">${new Date(n.created_at).toLocaleString('en-IN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <h4 style="margin:0 0 4px 0; font-size:16px; font-weight:700; color:var(--text-dark);">${n.title}</h4>
                <p style="margin:0; font-size:14px; color:var(--text-muted);">${n.message}</p>
                ${!n.is_read ? `<div style="margin-top:12px;"><span style="font-size:13px; font-weight:600; color:var(--primary);">Take Action →</span></div>` : ''}
            </div>
            <button onclick="event.stopPropagation(); deleteNotification(${n.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:4px;" title="Delete">🗑️</button>
        </div>
    `).join('');
}

function renderNotifDropdown() {
    const list = document.getElementById('notifDropdownList');
    if (!list) return;

    if (currentNotifications.length === 0) {
        list.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted); font-size:13px;">No new notifications! 🔔</div>`;
        return;
    }

    const latest = currentNotifications.slice(0, 5);
    list.innerHTML = latest.map(n => `
        <div style="padding:12px 16px; border-bottom:1px solid var(--border-color); display:flex; gap:12px; cursor:pointer; background:${n.is_read ? '#fff' : '#f0f4ff'};" onclick="handleNotifClick(${n.id}, '${n.link}')">
            <div style="font-size:24px;">${n.icon}</div>
            <div>
                <h4 style="margin:0; font-size:14px; font-weight:600; color:var(--text-dark);">${n.title}</h4>
                <p style="margin:4px 0 0 0; font-size:12px; color:var(--text-muted);">${n.message}</p>
                <div style="margin-top:4px; font-size:11px; color:var(--text-light);">${new Date(n.created_at).toLocaleString('en-IN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
            </div>
        </div>
    `).join('');
}

function renderNotifDashboard() {
    const container = document.getElementById('dashNotifContainer');
    if (!container) return;

    if (currentNotifications.length === 0) {
        container.innerHTML = `<p style="font-size:13px; color:var(--text-muted); margin:0;">No new notifications right now.</p>`;
        return;
    }

    const unread = currentNotifications.filter(n => !n.is_read).slice(0, 3);
    const toShow = unread.length > 0 ? unread : currentNotifications.slice(0, 3);
    
    container.innerHTML = toShow.map(n => `
        <div style="display:flex; align-items:center; gap:8px; cursor:pointer;" onclick="handleNotifClick(${n.id}, '${n.link}')">
            <div style="width:24px; height:24px; border-radius:50%; background:${n.is_read ? 'var(--bg-color)' : '#dbeafe'}; display:flex; align-items:center; justify-content:center; font-size:12px;">
                ${n.icon}
            </div>
            <div style="flex:1; min-width:0;">
                <p style="margin:0; font-size:13px; font-weight:${n.is_read ? '500' : '700'}; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${n.title}</p>
            </div>
        </div>
    `).join('');
}

async function handleNotifClick(id, link) {
    if (link && typeof showSection === 'function') {
        showSection(link);
    }
    document.getElementById('notifDropdown').style.display = 'none';
    
    // Mark read
    const n = currentNotifications.find(x => x.id === id);
    if (n && !n.is_read) {
        await markNotificationRead(id);
    }
}

async function markNotificationRead(id) {
    const token = getToken();
    try {
        await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
            method: 'PUT',
            headers: { "Authorization": "Bearer " + token }
        });
        const n = currentNotifications.find(x => x.id === id);
        if (n) n.is_read = 1;
        
        // Re-render
        renderNotifications();
        renderNotifDropdown();
        renderNotifDashboard();
        
        // Update badge
        const unreadCount = currentNotifications.filter(x => !x.is_read).length;
        updateNotifBadge(unreadCount);
    } catch(err) {
        console.error("Error marking read:", err);
    }
}

async function markAllNotificationsRead() {
    const token = getToken();
    try {
        await fetch(`${BACKEND_URL}/api/notifications/read-all`, {
            method: 'PUT',
            headers: { "Authorization": "Bearer " + token }
        });
        currentNotifications.forEach(n => n.is_read = 1);
        renderNotifications();
        renderNotifDropdown();
        renderNotifDashboard();
        updateNotifBadge(0);
    } catch(err) {
        console.error("Error marking all read:", err);
    }
}

async function deleteNotification(id) {
    const token = getToken();
    try {
        await fetch(`${BACKEND_URL}/api/notifications/${id}`, {
            method: 'DELETE',
            headers: { "Authorization": "Bearer " + token }
        });
        currentNotifications = currentNotifications.filter(x => x.id !== id);
        renderNotifications();
        renderNotifDropdown();
        renderNotifDashboard();
        const unreadCount = currentNotifications.filter(x => !x.is_read).length;
        updateNotifBadge(unreadCount);
    } catch(err) {
        console.error("Error deleting notification:", err);
    }
}

// =====================================================
// PHASE 12: PERSONAL WELLNESS PROGRESS & ANALYTICS CENTER
// =====================================================

let analyticsScoreChart = null;
let analyticsMoodChart = null;

async function loadWellnessAnalytics(period = '30') {
    const token = getToken();
    if (!token || !currentUser) {
        showMessage("Please login to view analytics.");
        return;
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/wellness-analytics?period=${period}`, {
            headers: { "Authorization": "Bearer " + token }
        });
        
        const data = await res.json();
        
        if (data.success) {
            renderAnalyticsCenter(data);
        } else {
            console.warn("Analytics Error:", data.message);
            document.getElementById("analyticsContent").style.display = "none";
            document.getElementById("analyticsEmptyState").style.display = "block";
        }
    } catch (err) {
        console.error("Error fetching analytics:", err);
        document.getElementById("analyticsContent").style.display = "none";
        document.getElementById("analyticsEmptyState").style.display = "block";
    }
}

function renderAnalyticsCenter(data) {
    const content = document.getElementById("analyticsContent");
    const emptyState = document.getElementById("analyticsEmptyState");
    
    // Check for empty data condition
    if (!data.wellnessScore.current && data.mood.history.length === 0 && data.journals.total === 0 && data.goals.completed === 0) {
        content.style.display = "none";
        emptyState.style.display = "block";
        return;
    }
    
    content.style.display = "block";
    emptyState.style.display = "none";

    // 1. Summary & Strengths
    document.getElementById("analyticsSummary").textContent = data.summary || "Keep tracking to generate insights.";
    
    const strengthsEl = document.getElementById("analyticsStrengths");
    strengthsEl.innerHTML = (data.strengths || []).map(s => `<li>${escapeHTMLSafe(s)}</li>`).join('');
    
    const improvementsEl = document.getElementById("analyticsImprovements");
    improvementsEl.innerHTML = (data.improvements || []).map(s => `<li>${escapeHTMLSafe(s)}</li>`).join('');

    // 2. Main Metrics
    document.getElementById("analyticsScore").textContent = data.wellnessScore.current || "--";
    const changeEl = document.getElementById("analyticsScoreChange");
    if (data.wellnessScore.change > 0) {
        changeEl.textContent = `+${data.wellnessScore.change} points`;
        changeEl.style.color = "#10b981";
    } else if (data.wellnessScore.change < 0) {
        changeEl.textContent = `${data.wellnessScore.change} points`;
        changeEl.style.color = "#ef4444";
    } else {
        changeEl.textContent = "No change";
        changeEl.style.color = "#6b7280";
    }

    document.getElementById("analyticsMoodAvg").textContent = data.mood.avgScore > 0 ? data.mood.avgScore : "--";
    document.getElementById("analyticsMoodFreq").textContent = data.mood.mostFrequent || "--";
    document.getElementById("analyticsMoodStats").textContent = `${data.mood.positivePct}% Positive | ${data.mood.consistency}% Consistent`;

    document.getElementById("analyticsGoalPct").textContent = `${data.goals.completionPct}%`;
    document.getElementById("analyticsHabitPct").textContent = `${data.habits.consistency}%`;
    document.getElementById("analyticsGoalStats").textContent = `${data.goals.completed} Goals Done | ${data.habits.completed} Habits Done`;

    // 3. Personal Bests
    const bestsEl = document.getElementById("analyticsBests");
    let bestsHTML = "";
    if (data.personalBests.highestWellnessScore > 0) bestsHTML += `<div style="text-align:center; padding:10px; background:#f3f4f6; border-radius:12px;"><div style="font-size:24px; font-weight:800; color:var(--primary);">${data.personalBests.highestWellnessScore}</div><div style="font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase;">Best Score</div></div>`;
    if (data.personalBests.longestStreak > 0) bestsHTML += `<div style="text-align:center; padding:10px; background:#f3f4f6; border-radius:12px;"><div style="font-size:24px; font-weight:800; color:var(--primary);">${data.personalBests.longestStreak}🔥</div><div style="font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase;">Best Streak</div></div>`;
    if (data.personalBests.mostGoals > 0) bestsHTML += `<div style="text-align:center; padding:10px; background:#f3f4f6; border-radius:12px;"><div style="font-size:24px; font-weight:800; color:var(--primary);">${data.personalBests.mostGoals}</div><div style="font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase;">Goals Done</div></div>`;
    if (data.personalBests.highestLevel > 0) bestsHTML += `<div style="text-align:center; padding:10px; background:#f3f4f6; border-radius:12px;"><div style="font-size:24px; font-weight:800; color:var(--primary);">Lvl ${data.personalBests.highestLevel}</div><div style="font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase;">Highest Level</div></div>`;
    
    bestsEl.innerHTML = bestsHTML || "<div style='color:#6b7280; font-size:14px;'>No personal bests yet.</div>";

    // 4. Charts
    renderAnalyticsCharts(data);
}

function renderAnalyticsCharts(data) {
    // Score Chart
    if (analyticsScoreChart) analyticsScoreChart.destroy();
    const scoreCtx = document.getElementById('analyticsScoreChart');
    if (scoreCtx && data.wellnessScore.history.length > 0) {
        const labels = data.wellnessScore.history.map(s => new Date(s.score_date).toLocaleDateString('en-IN', {month:'short', day:'numeric'}));
        const points = data.wellnessScore.history.map(s => s.score);
        
        analyticsScoreChart = new Chart(scoreCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Wellness Score',
                    data: points,
                    borderColor: '#6c63ff',
                    backgroundColor: 'rgba(108, 99, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { min: 0, max: 100 } }
            }
        });
    }

    // Mood Chart
    if (analyticsMoodChart) analyticsMoodChart.destroy();
    const moodCtx = document.getElementById('analyticsMoodChart');
    if (moodCtx && data.mood.history.length > 0) {
        // We aggregate moods by date if there are multiple per day to make a cleaner line chart
        const dailyMoods = {};
        data.mood.history.forEach(m => {
            const d = new Date(m.mood_date).toLocaleDateString('en-IN', {month:'short', day:'numeric'});
            if (!dailyMoods[d]) dailyMoods[d] = [];
            dailyMoods[d].push(m.mood);
        });
        
        const labels = Object.keys(dailyMoods);
        const points = labels.map(l => {
            const arr = dailyMoods[l];
            let total = 0;
            // Assuming moodToScore is available in global scope if not re-declare here:
            const M_SCORES = {"Happy":5, "Excited":5, "Great":5, "Good":4, "Okay":3, "Neutral":3, "Tired":2, "Sad":2, "Anxious":2, "Angry":1, "Terrible":1};
            arr.forEach(mood => {
                const s = Object.keys(M_SCORES).find(k => k.toLowerCase() === mood.toLowerCase());
                total += s ? M_SCORES[s] : 3;
            });
            return total / arr.length;
        });

        analyticsMoodChart = new Chart(moodCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Avg Mood Score',
                    data: points,
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } }
            }
        });
    }
}

// Add click listeners to filter buttons
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll(".analytics-period-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".analytics-period-btn").forEach(b => b.classList.replace('iv-btn-primary', 'iv-btn-secondary'));
            this.classList.replace('iv-btn-secondary', 'iv-btn-primary');
            const period = this.dataset.period;
            loadWellnessAnalytics(period);
        });
    });
    
    // Automatically load analytics preview on dashboard load
    const origNav = window.navigateTo;
    if(origNav) {
        window.navigateTo = function(sectionId) {
            origNav(sectionId);
            if(sectionId === 'dashboard') {
                loadAnalyticsPreview();
            }
        };
    }
});

async function loadAnalyticsPreview() {
    const token = getToken();
    if (!token) return;
    try {
        const res = await fetch(`${BACKEND_URL}/api/wellness-analytics?period=7`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();
        if(data.success) {
            document.getElementById('dashPreviewMood').textContent = data.mood.avgScore > 0 ? data.mood.avgScore : '--';
            document.getElementById('dashPreviewGoals').textContent = `${data.goals.completionPct}%`;
            document.getElementById('dashPreviewHabits').textContent = `${data.habits.consistency}%`;
        }
    } catch(e) {
        console.error("Error loading analytics preview", e);
    }
}

window.loadAssistantDailyMessage = async function() {
    const dashMsgEl = document.getElementById("dashAssistantDailyMsg");
    if (!dashMsgEl) return;
    const token = getToken();
    if (!token) {
        dashMsgEl.textContent = "Please log in to receive personalized wellness tips.";
        return;
    }
    try {
        const res = await fetch(BACKEND_URL + "/api/chat/daily-message", {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();
        if (data.success && data.message) {
            dashMsgEl.textContent = data.message;
        } else {
            dashMsgEl.textContent = "Take a deep breath and start your day with positivity. 🌿";
        }
    } catch (err) {
        dashMsgEl.textContent = "Start your day with a moment of calm. 🌿";
    }
}

/* =====================================================
   PHASE 15: WEEKLY WELLNESS INSIGHTS
===================================================== */

async function fetchWeeklyWellnessInsights() {
    const dashWeeklyInsightsWidget = document.getElementById("dashWeeklyInsightsWidget");
    if (!dashWeeklyInsightsWidget) return;

    const token = getToken();
    if (!token) {
        dashWeeklyInsightsWidget.style.display = "none";
        return;
    }

    dashWeeklyInsightsWidget.style.display = "block";
    const loading = document.getElementById("weeklyInsightsLoading");
    const content = document.getElementById("weeklyInsightsContent");
    const empty = document.getElementById("weeklyInsightsEmpty");

    if (loading) loading.style.display = "block";
    if (content) content.style.display = "none";
    if (empty) empty.style.display = "none";

    try {
        const response = await fetch(`${BACKEND_URL}/api/insights/weekly`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await response.json();

        if (data.success && data.data) {
            renderWeeklyWellnessInsights(data.data);
        } else {
            if (loading) loading.style.display = "none";
            if (empty) empty.style.display = "block";
        }
    } catch (err) {
        console.error("Error fetching weekly wellness insights:", err);
        if (loading) loading.style.display = "none";
        if (empty) empty.style.display = "block";
    }
}

function renderWeeklyWellnessInsights(data) {
    const loading = document.getElementById("weeklyInsightsLoading");
    const content = document.getElementById("weeklyInsightsContent");
    const empty = document.getElementById("weeklyInsightsEmpty");

    if (loading) loading.style.display = "none";

    if (data.score.trend === "insufficient_data") {
        if (empty) empty.style.display = "block";
        if (content) content.style.display = "none";
        return;
    }

    if (content) content.style.display = "block";
    if (empty) empty.style.display = "none";

    // Score
    const scoreVal = document.getElementById("weeklyScoreVal");
    const scoreTrend = document.getElementById("weeklyScoreTrend");
    if (scoreVal) scoreVal.textContent = data.score.current;
    
    if (scoreTrend) {
        let diffStr = data.score.difference > 0 ? "+" + data.score.difference : data.score.difference;
        if (data.score.trend === 'improving') {
            scoreTrend.innerHTML = `<span style="color:#10b981;">↑ ${diffStr}</span> from last week`;
        } else if (data.score.trend === 'declining') {
            scoreTrend.innerHTML = `<span style="color:#ef4444;">↓ ${diffStr}</span> from last week`;
        } else {
            scoreTrend.innerHTML = `<span style="color:var(--text-muted);">Stable</span> from last week`;
        }
    }

    // AI Insight
    const aiSummary = document.getElementById("weeklyAiSummary");
    const aiRecs = document.getElementById("weeklyAiRecommendations");
    if (aiSummary) aiSummary.textContent = data.aiInsight.summary;
    if (aiRecs) {
        aiRecs.innerHTML = data.aiInsight.recommendations.map(r => `<li>${r}</li>`).join("");
    }

    // Mood
    const moodAvg = document.getElementById("weeklyMoodAvg");
    const moodTrend = document.getElementById("weeklyMoodTrend");
    if (moodAvg) moodAvg.textContent = data.mood.average ? data.mood.average.toFixed(1) + " / 5" : "--";
    if (moodTrend) {
        if (data.mood.trend === 'improving') moodTrend.innerHTML = `<span style="color:#10b981;">↑ Improved</span>`;
        else if (data.mood.trend === 'declining') moodTrend.innerHTML = `<span style="color:#ef4444;">↓ Declined</span>`;
        else if (data.mood.trend === 'stable') moodTrend.innerHTML = "Stable";
        else moodTrend.innerHTML = "Not enough data";
    }

    // Habits
    const habitRate = document.getElementById("weeklyHabitRate");
    const habitDetails = document.getElementById("weeklyHabitDetails");
    if (habitRate) habitRate.textContent = data.habits.completionRate !== null ? Math.round(data.habits.completionRate) + "%" : "--%";
    if (habitDetails) habitDetails.textContent = `${data.habits.completed} / ${data.habits.expected} completed`;

    // Goals
    const goalsComp = document.getElementById("weeklyGoalsCompleted");
    const goalsDetails = document.getElementById("weeklyGoalsDetails");
    if (goalsComp) goalsComp.textContent = data.goals.completed;
    if (goalsDetails) goalsDetails.textContent = `${data.goals.milestonesCompleted} milestones hit`;

    // Daily Plan
    const planRate = document.getElementById("weeklyDailyPlanRate");
    const planDetails = document.getElementById("weeklyDailyPlanDetails");
    if (planRate) planRate.textContent = data.dailyPlan.completionRate !== null ? Math.round(data.dailyPlan.completionRate) + "%" : "--%";
    if (planDetails) planDetails.textContent = `${data.dailyPlan.completed} done, ${data.dailyPlan.skipped} skipped`;

    // Journals & Reflections
    const journalsTotal = document.getElementById("weeklyJournalsTotal");
    if (journalsTotal) journalsTotal.textContent = data.journals.entries + data.reflections.entries;
}

// Hook into existing dashboard load (adding it globally)
const originalLoadDashboard = window.updateDashboard;
if (originalLoadDashboard) {
    window.updateDashboard = function() {
        originalLoadDashboard();
        fetchWeeklyWellnessInsights();
    }
} else {
    // If updateDashboard is not available, try adding to DOMContentLoaded
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(fetchWeeklyWellnessInsights, 1000); // delay to let auth initialize
    });
}
