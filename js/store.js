import {
  uid,
  hashPassword,
  generatePostArtworkBlob,
  showStorageError,
  showToast,
  getAIResponseMessage
} from './utils.js';
import { saveMediaBlob, deleteMediaBlob } from './db.js';

const STORAGE_KEY = 'facegram_state_v1';

const defaultState = () => ({
  seeded: false,
  theme: 'light',
  sessionUserId: null,
  users: [],
  posts: [],
  comments: [],
  reactions: {},
  follows: [],
  saved: {},
  stories: [],
  messages: [],
  notifications: []
});

class Store {
  constructor() {
    this.state = defaultState();
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.state = { ...defaultState(), ...parsed };
      }
    } catch (err) {
      showStorageError('Unable to read from localStorage. Check browser privacy settings.');
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (err) {
      if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
        showStorageError('localStorage quota exceeded! Clear old posts or messages to free up space.');
      } else {
        showStorageError('Failed to persist data to localStorage.');
      }
    }
  }

  async init() {
    this.load();
    this.applyTheme();
    if (!this.state.seeded || this.state.users.length === 0) {
      await this.seedDemoData();
    }
  }

  async seedDemoData() {
    const defaultPassHash = await hashPassword('demo123');
    const now = Date.now();
    const min = 60 * 1000;
    const hr = 60 * min;

    const demoUsers = [
      {
        id: 'u_maya',
        username: 'maya.lin',
        displayName: 'Maya Lin',
        bio: 'Architectural photographer & espresso enthusiast. Chasing light across cities.',
        avatarPreset: 'sunset',
        avatarMediaId: null,
        passwordHash: defaultPassHash
      },
      {
        id: 'u_alex',
        username: 'alex.rivera',
        displayName: 'Alex Rivera',
        bio: 'Product designer building minimal interfaces & analog synths.',
        avatarPreset: 'aurora',
        avatarMediaId: null,
        passwordHash: defaultPassHash
      },
      {
        id: 'u_sara',
        username: 'sara.chen',
        displayName: 'Sara Chen',
        bio: 'Botanical illustrator, matcha collector & weekend trail runner.',
        avatarPreset: 'emerald',
        avatarMediaId: null,
        passwordHash: defaultPassHash
      },
      {
        id: 'u_liam',
        username: 'liam.vance',
        displayName: 'Liam Vance',
        bio: 'Street food documentarian & vinyl crate digger.',
        avatarPreset: 'amber',
        avatarMediaId: null,
        passwordHash: defaultPassHash
      },
      {
        id: 'u_elena',
        username: 'elena.rostova',
        displayName: 'Elena Rostova',
        bio: 'Creative coder exploring generative shaders and kinetic typography.',
        avatarPreset: 'violet',
        avatarMediaId: null,
        passwordHash: defaultPassHash
      },
      {
        id: 'u_noah',
        username: 'noah.patel',
        displayName: 'Noah Patel',
        bio: 'Coastal surfer, film camera tinkerer & specialty roaster.',
        avatarPreset: 'midnight',
        avatarMediaId: null,
        passwordHash: defaultPassHash
      }
    ];

    const artworks = [
      { id: 'seed_media_1', theme: 0, title: 'GOLDEN HOUR', subtitle: 'Rooftop reflections at dusk' },
      { id: 'seed_media_2', theme: 1, title: 'NORDIC FJORD', subtitle: 'Silent waters & mist' },
      { id: 'seed_media_3', theme: 2, title: 'NEON HORIZON', subtitle: 'Late night synth session' },
      { id: 'seed_media_4', theme: 3, title: 'FOREST CANOPY', subtitle: 'Morning trail run 12km' },
      { id: 'seed_media_5', theme: 4, title: 'STUDIO NOTES', subtitle: 'Generative geometry study #08' },
      { id: 'seed_media_6', theme: 5, title: 'PACIFIC SWELL', subtitle: '6AM glass off the point' }
    ];

    for (const art of artworks) {
      try {
        const blob = await generatePostArtworkBlob(art.theme, art.title, art.subtitle);
        if (blob) await saveMediaBlob(blob, art.id);
      } catch (_) {
        // Fallback if IndexedDB is blocked
      }
    }

    const demoPosts = [
      {
        id: 'p_101',
        userId: 'u_maya',
        mediaId: 'seed_media_1',
        mediaType: 'image',
        bgGradient: null,
        caption: 'Caught the last 10 minutes of golden hour from the studio terrace. Nothing beats this color palette.',
        createdAt: now - 25 * min
      },
      {
        id: 'p_102',
        userId: 'u_alex',
        mediaId: null,
        mediaType: 'text',
        bgGradient: 'grad-aurora',
        caption: 'Hot take: Good UI design is 80% typography and spacing, 20% restraint.',
        createdAt: now - 2 * hr
      },
      {
        id: 'p_103',
        userId: 'u_sara',
        mediaId: 'seed_media_4',
        mediaType: 'image',
        bgGradient: null,
        caption: 'Mist rolling through the redwoods on this morning’s 12km loop. Recharged for the week ahead.',
        createdAt: now - 5 * hr
      },
      {
        id: 'p_104',
        userId: 'u_elena',
        mediaId: 'seed_media_5',
        mediaType: 'image',
        bgGradient: null,
        caption: 'Playing with procedural color fields on HTML5 canvas—no external assets needed.',
        createdAt: now - 9 * hr
      },
      {
        id: 'p_105',
        userId: 'u_liam',
        mediaId: null,
        mediaType: 'text',
        bgGradient: 'grad-sunset',
        caption: 'Found a 1974 pressing of Head Hunters at the neighborhood flea market for $4!',
        createdAt: now - 16 * hr
      },
      {
        id: 'p_106',
        userId: 'u_noah',
        mediaId: 'seed_media_6',
        mediaType: 'image',
        bgGradient: null,
        caption: 'Glassiest dawn patrol all month. Coffee tastes twice as good after cold water.',
        createdAt: now - 22 * hr
      }
    ];

    this.state = {
      seeded: true,
      theme: this.state.theme || 'light',
      sessionUserId: 'u_maya',
      users: demoUsers,
      posts: demoPosts,
      comments: [
        {
          id: 'c_1',
          postId: 'p_101',
          userId: 'u_alex',
          text: 'Those gradients look unreal!',
          createdAt: now - 18 * min
        },
        {
          id: 'c_2',
          postId: 'p_101',
          userId: 'u_sara',
          text: 'Love the warmth in this shot.',
          createdAt: now - 10 * min
        },
        {
          id: 'c_3',
          postId: 'p_102',
          userId: 'u_elena',
          text: '100% agreed. Whitespace does the heavy lifting.',
          createdAt: now - 90 * min
        },
        {
          id: 'c_4',
          postId: 'p_103',
          userId: 'u_noah',
          text: 'That trail looks incredible!',
          createdAt: now - 3 * hr
        }
      ],
      reactions: {
        p_101: { u_alex: 'love', u_sara: 'wow', u_elena: 'love', u_noah: 'like' },
        p_102: { u_maya: 'like', u_elena: 'haha', u_liam: 'love' },
        p_103: { u_maya: 'love', u_noah: 'wow' },
        p_104: { u_alex: 'wow', u_maya: 'love' },
        p_105: { u_noah: 'haha', u_alex: 'love' },
        p_106: { u_maya: 'love', u_sara: 'like' }
      },
      follows: [
        { followerId: 'u_maya', followingId: 'u_alex' },
        { followerId: 'u_maya', followingId: 'u_sara' },
        { followerId: 'u_maya', followingId: 'u_elena' },
        { followerId: 'u_alex', followingId: 'u_maya' },
        { followerId: 'u_sara', followingId: 'u_maya' },
        { followerId: 'u_noah', followingId: 'u_maya' }
      ],
      saved: {
        u_maya: ['p_103', 'p_104']
      },
      stories: [
        {
          id: 'st_1',
          userId: 'u_maya',
          mediaId: 'seed_media_1',
          text: 'Studio light check ✨',
          bgGradient: 'grad-berry',
          seenBy: [],
          createdAt: now - 40 * min
        },
        {
          id: 'st_2',
          userId: 'u_alex',
          mediaId: null,
          text: 'Shipping dark mode tokens today!',
          bgGradient: 'grad-ocean',
          seenBy: [],
          createdAt: now - 2 * hr
        },
        {
          id: 'st_3',
          userId: 'u_sara',
          mediaId: 'seed_media_4',
          text: 'Redwood trails 🌲',
          bgGradient: 'grad-aurora',
          seenBy: [],
          createdAt: now - 4 * hr
        },
        {
          id: 'st_4',
          userId: 'u_elena',
          mediaId: 'seed_media_5',
          text: 'Canvas experiments 🎨',
          bgGradient: 'grad-ember',
          seenBy: [],
          createdAt: now - 6 * hr
        }
      ],
      messages: [
        {
          id: 'm_1',
          senderId: 'u_alex',
          receiverId: 'u_maya',
          text: 'Hey Maya! Are we still on for coffee & portfolio review tomorrow?',
          mediaId: null,
          createdAt: now - 55 * min
        },
        {
          id: 'm_2',
          senderId: 'u_maya',
          receiverId: 'u_alex',
          text: 'Definitely! Let’s meet at Ritual around 10am.',
          mediaId: null,
          createdAt: now - 48 * min
        },
        {
          id: 'm_3',
          senderId: 'u_sara',
          receiverId: 'u_maya',
          text: 'Loved your rooftop series from yesterday!',
          mediaId: null,
          createdAt: now - 3 * hr
        }
      ],
      notifications: [
        {
          id: 'n_1',
          userId: 'u_maya',
          actorId: 'u_alex',
          type: 'reaction',
          reactionType: 'love',
          postId: 'p_101',
          read: false,
          createdAt: now - 18 * min
        },
        {
          id: 'n_2',
          userId: 'u_maya',
          actorId: 'u_sara',
          type: 'comment',
          postId: 'p_101',
          read: false,
          createdAt: now - 10 * min
        },
        {
          id: 'n_3',
          userId: 'u_maya',
          actorId: 'u_noah',
          type: 'follow',
          postId: null,
          read: true,
          createdAt: now - 4 * hr
        }
      ]
    };

    this.save();
    this.notify();
  }

  getTheme() {
    return this.state.theme || 'light';
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.getTheme());
  }

  toggleTheme() {
    this.state.theme = this.getTheme() === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    this.save();
    this.notify();
  }

  getCurrentUser() {
    return this.state.users.find((u) => u.id === this.state.sessionUserId) || null;
  }

  getUserById(userId) {
    return this.state.users.find((u) => u.id === userId) || null;
  }

  getUserByUsername(username) {
    const clean = String(username || '').toLowerCase();
    return this.state.users.find((u) => u.username.toLowerCase() === clean) || null;
  }

  getAllUsers() {
    return [...this.state.users];
  }

  async login(username, password) {
    const user = this.getUserByUsername(username.trim());
    if (!user) throw new Error('User not found.');
    const passHash = await hashPassword(password);
    if (user.passwordHash !== passHash) {
      throw new Error('Incorrect password. (Tip: Demo users use "demo123")');
    }
    this.state.sessionUserId = user.id;
    this.save();
    this.notify();
    return user;
  }

  async signup({ username, displayName, bio, password, avatarPreset }) {
    const cleanUsername = String(username || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, '');

    if (cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 valid characters (letters, numbers, . or _).');
    }
    if (this.getUserByUsername(cleanUsername)) {
      throw new Error('That username is already taken.');
    }
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters.');
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      id: uid('u'),
      username: cleanUsername,
      displayName: (displayName || cleanUsername).trim(),
      bio: (bio || 'New on Facegram ✨').trim(),
      avatarPreset: avatarPreset || 'aurora',
      avatarMediaId: null,
      passwordHash
    };

    this.state.users.push(newUser);
    this.state.sessionUserId = newUser.id;
    this.save();
    this.notify();
    return newUser;
  }

  quickSwitchUser(userId) {
    const user = this.getUserById(userId);
    if (!user) return null;
    this.state.sessionUserId = user.id;
    this.save();
    this.notify();
    return user;
  }

  logout() {
    this.state.sessionUserId = null;
    this.save();
    this.notify();
  }

  updateProfile(userId, { displayName, bio, avatarPreset, avatarMediaId }) {
    const user = this.getUserById(userId);
    if (!user) return null;
    if (displayName !== undefined) user.displayName = displayName.trim() || user.username;
    if (bio !== undefined) user.bio = bio.trim();
    if (avatarPreset) user.avatarPreset = avatarPreset;
    if (avatarMediaId !== undefined) user.avatarMediaId = avatarMediaId;
    this.save();
    this.notify();
    return user;
  }

  isFollowing(followerId, followingId) {
    return this.state.follows.some(
      (f) => f.followerId === followerId && f.followingId === followingId
    );
  }

  toggleFollow(targetUserId) {
    const current = this.getCurrentUser();
    if (!current || current.id === targetUserId) return;

    const idx = this.state.follows.findIndex(
      (f) => f.followerId === current.id && f.followingId === targetUserId
    );

    if (idx >= 0) {
      this.state.follows.splice(idx, 1);
    } else {
      this.state.follows.push({ followerId: current.id, followingId: targetUserId });
      this.addNotification({
        userId: targetUserId,
        actorId: current.id,
        type: 'follow',
        postId: null
      });
    }
    this.save();
    this.notify();
  }

  getFollowerCount(userId) {
    return this.state.follows.filter((f) => f.followingId === userId).length;
  }

  getFollowingCount(userId) {
    return this.state.follows.filter((f) => f.followerId === userId).length;
  }

  getSuggestedUsers() {
    const current = this.getCurrentUser();
    if (!current) return [];
    return this.state.users.filter((u) => u.id !== current.id);
  }

  getFeedPosts() {
    return [...this.state.posts].sort((a, b) => b.createdAt - a.createdAt);
  }

  getExplorePosts(query = '') {
    const q = query.trim().toLowerCase();
    const sorted = [...this.state.posts].sort((a, b) => b.createdAt - a.createdAt);
    if (!q) return sorted;
    return sorted.filter((p) => {
      const author = this.getUserById(p.userId);
      const matchCaption = (p.caption || '').toLowerCase().includes(q);
      const matchUser =
        author &&
        (author.username.toLowerCase().includes(q) || author.displayName.toLowerCase().includes(q));
      return matchCaption || matchUser;
    });
  }

  getUserPosts(userId) {
    return this.state.posts
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getSavedPosts(userId) {
    const ids = this.state.saved[userId] || [];
    return ids
      .map((id) => this.getPostById(id))
      .filter(Boolean);
  }

  getPostById(postId) {
    return this.state.posts.find((p) => p.id === postId) || null;
  }

  createPost({ caption, mediaId = null, mediaType = 'text', bgGradient = 'grad-ocean' }) {
    const current = this.getCurrentUser();
    if (!current) throw new Error('Must be logged in');

    const post = {
      id: uid('p'),
      userId: current.id,
      mediaId,
      mediaType,
      bgGradient: mediaType === 'text' ? bgGradient : null,
      caption: (caption || '').trim(),
      createdAt: Date.now()
    };

    this.state.posts.unshift(post);
    this.save();
    this.notify();
    return post;
  }

  async deletePost(postId) {
    const current = this.getCurrentUser();
    const post = this.getPostById(postId);
    if (!current || !post || post.userId !== current.id) return;

    if (post.mediaId && !post.mediaId.startsWith('seed_')) {
      await deleteMediaBlob(post.mediaId);
    }

    this.state.posts = this.state.posts.filter((p) => p.id !== postId);
    this.state.comments = this.state.comments.filter((c) => c.postId !== postId);
    delete this.state.reactions[postId];
    this.save();
    this.notify();
  }

  isPostSaved(postId) {
    const current = this.getCurrentUser();
    if (!current) return false;
    const list = this.state.saved[current.id] || [];
    return list.includes(postId);
  }

  toggleSavePost(postId) {
    const current = this.getCurrentUser();
    if (!current) return false;
    if (!this.state.saved[current.id]) {
      this.state.saved[current.id] = [];
    }
    const list = this.state.saved[current.id];
    const idx = list.indexOf(postId);
    let savedNow = false;
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.unshift(postId);
      savedNow = true;
    }
    this.save();
    this.notify();
    return savedNow;
  }

  getUserReaction(postId, userId) {
    return (this.state.reactions[postId] && this.state.reactions[postId][userId]) || null;
  }

  setReaction(postId, reactionType, forceKeep = false) {
    const current = this.getCurrentUser();
    const post = this.getPostById(postId);
    if (!current || !post) return;

    if (!this.state.reactions[postId]) {
      this.state.reactions[postId] = {};
    }

    const existing = this.state.reactions[postId][current.id];
    if (existing === reactionType && !forceKeep) {
      delete this.state.reactions[postId][current.id];
    } else {
      this.state.reactions[postId][current.id] = reactionType;
      if (post.userId !== current.id) {
        this.addNotification({
          userId: post.userId,
          actorId: current.id,
          type: 'reaction',
          reactionType,
          postId
        });
      }
    }
    this.save();
    this.notify();
  }

  getReactionSummary(postId) {
    const map = this.state.reactions[postId] || {};
    const counts = {};
    let total = 0;
    Object.values(map).forEach((type) => {
      counts[type] = (counts[type] || 0) + 1;
      total += 1;
    });

    const topTypes = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    return { total, counts, topTypes };
  }

  getPostComments(postId) {
    return this.state.comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  addComment(postId, text) {
    const current = this.getCurrentUser();
    const post = this.getPostById(postId);
    const clean = String(text || '').trim();
    if (!current || !post || !clean) return null;

    const comment = {
      id: uid('c'),
      postId,
      userId: current.id,
      text: clean,
      createdAt: Date.now()
    };

    this.state.comments.push(comment);

    if (post.userId !== current.id) {
      this.addNotification({
        userId: post.userId,
        actorId: current.id,
        type: 'comment',
        postId
      });
    }

    this.save();
    this.notify();
    return comment;
  }

  deleteComment(commentId) {
    const current = this.getCurrentUser();
    if (!current) return;
    this.state.comments = this.state.comments.filter(
      (c) => !(c.id === commentId && c.userId === current.id)
    );
    this.save();
    this.notify();
  }

  getActiveStories() {
    return [...this.state.stories].sort((a, b) => b.createdAt - a.createdAt);
  }

  createStory({ mediaId = null, text = '', bgGradient = 'grad-berry' }) {
    const current = this.getCurrentUser();
    if (!current) return null;

    const story = {
      id: uid('st'),
      userId: current.id,
      mediaId,
      text: text.trim(),
      bgGradient,
      seenBy: [current.id],
      createdAt: Date.now()
    };

    this.state.stories.unshift(story);
    this.save();
    this.notify();
    return story;
  }

  markStorySeen(storyId) {
    const current = this.getCurrentUser();
    const story = this.state.stories.find((s) => s.id === storyId);
    if (!current || !story) return;

    if (!story.seenBy.includes(current.id)) {
      story.seenBy.push(current.id);
      this.save();
      this.notify();
    }
  }

  getMessagesWithUser(partnerId) {
    const current = this.getCurrentUser();
    if (!current) return [];
    return this.state.messages
      .filter(
        (m) =>
          (m.senderId === current.id && m.receiverId === partnerId) ||
          (m.senderId === partnerId && m.receiverId === current.id)
      )
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  sendMessage(receiverId, { text = '', mediaId = null }) {
    const current = this.getCurrentUser();
    const clean = text.trim();
    if (!current || (!clean && !mediaId)) return null;

    const msg = {
      id: uid('m'),
      senderId: current.id,
      receiverId,
      text: clean,
      mediaId,
      createdAt: Date.now()
    };

    this.state.messages.push(msg);
    this.save();
    this.notify();

    // Simulated intelligent AI persona reply
    const partner = this.getUserById(receiverId);
    if (partner && partner.id !== current.id) {
      const aiReply = getAIResponseMessage({
        text: clean,
        mediaId,
        partner,
        currentUser: current
      });
      setTimeout(() => {
        this.state.messages.push({
          id: uid('m'),
          senderId: partner.id,
          receiverId: current.id,
          text: aiReply,
          mediaId: null,
          createdAt: Date.now()
        });
        this.save();
        this.notify();
      }, 900);
    }

    return msg;
  }

  addNotification({ userId, actorId, type, reactionType = null, postId = null }) {
    if (userId === actorId) return;
    this.state.notifications.unshift({
      id: uid('n'),
      userId,
      actorId,
      type,
      reactionType,
      postId,
      read: false,
      createdAt: Date.now()
    });
  }

  getNotifications() {
    const current = this.getCurrentUser();
    if (!current) return [];
    return this.state.notifications
      .filter((n) => n.userId === current.id)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getUnreadNotificationCount() {
    return this.getNotifications().filter((n) => !n.read).length;
  }

  markAllNotificationsRead() {
    const current = this.getCurrentUser();
    if (!current) return;
    this.state.notifications.forEach((n) => {
      if (n.userId === current.id) n.read = true;
    });
    this.save();
    this.notify();
  }
}

export const store = new Store();
