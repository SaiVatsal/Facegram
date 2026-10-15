import { store } from '../store.js';
import { escapeHTML, getLogoSVG, renderAvatar, PRESET_AVATARS } from '../utils.js';

export function renderAuthPage(container) {
  const users = store.getAllUsers();

  const demoUsersHTML = users
    .map(
      (u) => `
        <button
          type="button"
          class="demo-user-btn"
          data-action="quick-switch-user"
          data-user-id="${escapeHTML(u.id)}"
        >
          ${renderAvatar(u, 'avatar-sm')}
          <div class="rail-user-text">
            <span class="rail-username">${escapeHTML(u.displayName)}</span>
            <span class="rail-subtext">@${escapeHTML(u.username)}</span>
          </div>
        </button>
      `
    )
    .join('');

  const presetOptionsHTML = Object.keys(PRESET_AVATARS)
    .map(
      (key) =>
        `<option value="${escapeHTML(key)}">${escapeHTML(
          key.charAt(0).toUpperCase() + key.slice(1)
        )} Avatar</option>`
    )
    .join('');

  container.innerHTML = `
    <div class="auth-container">
      <section class="auth-card" aria-label="Authentication">
        <div class="auth-header">
          ${getLogoSVG('logo-svg-lg')}
          <h1 class="brand-title">Facegram</h1>
          <p class="auth-subtitle">Clean photo sharing meets expressive social reactions.</p>
        </div>

        <div class="auth-tabs" role="tablist">
          <button
            type="button"
            class="auth-tab-btn active"
            data-action="switch-auth-tab"
            data-tab="login"
          >Log In</button>
          <button
            type="button"
            class="auth-tab-btn"
            data-action="switch-auth-tab"
            data-tab="signup"
          >Sign Up</button>
        </div>

        <!-- Login Form -->
        <div id="auth-login-pane">
          <form data-action="login-form">
            <div class="form-group">
              <label class="form-label" for="login-username">Username</label>
              <input
                type="text"
                id="login-username"
                name="username"
                class="form-input"
                placeholder="e.g. jubair.bhuyan"
                value="jubair.bhuyan"
                required
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                name="password"
                class="form-input"
                placeholder="Enter password (jubair123)"
                value="jubair123"
                required
                autocomplete="current-password"
              />
            </div>

            <button type="submit" class="btn btn-primary btn-block">Log In</button>
          </form>
        </div>

        <!-- Sign Up Form -->
        <div id="auth-signup-pane" class="hidden">
          <form data-action="signup-form">
            <div class="form-group">
              <label class="form-label" for="signup-username">Username</label>
              <input
                type="text"
                id="signup-username"
                name="username"
                class="form-input"
                placeholder="letters, numbers, dots or underscores"
                maxlength="24"
                required
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="signup-display-name">Display Name</label>
              <input
                type="text"
                id="signup-display-name"
                name="displayName"
                class="form-input"
                placeholder="Your full name"
                maxlength="40"
                required
                autocomplete="name"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="signup-avatar">Preset Avatar Style</label>
              <select id="signup-avatar" name="avatarPreset" class="form-input">
                ${presetOptionsHTML}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="signup-bio">Short Bio</label>
              <input
                type="text"
                id="signup-bio"
                name="bio"
                class="form-input"
                placeholder="Tell people a bit about yourself..."
                maxlength="140"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="signup-password">Password</label>
              <input
                type="password"
                id="signup-password"
                name="password"
                class="form-input"
                placeholder="At least 4 characters"
                minlength="4"
                required
                autocomplete="new-password"
              />
            </div>

            <button type="submit" class="btn btn-primary btn-block">Create Account</button>
          </form>
        </div>
      </section>

      <section class="demo-switch-card" aria-label="Quick Demo Switch">
        <div class="demo-switch-title">Instant Demo Switch (1-Click Login)</div>
        <div class="demo-users-grid">
          ${demoUsersHTML}
        </div>
      </section>
    </div>
  `;
}
