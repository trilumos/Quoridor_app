import { StorageService } from "../storage/StorageService";

export type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED";

export interface LocalUser {
  id: string;
  email: string | null;
  created_at: string;
  user_metadata: Record<string, string>;
}

export interface Session {
  user: LocalUser;
}

type Listener = (event: AuthChangeEvent, session: Session | null) => void;

const DEFAULT_EMAIL = "player@quoridor.local";

let sessionCache: Session | null | undefined;
let loadPromise: Promise<Session | null> | null = null;
const listeners = new Set<Listener>();

function makeRandomLocalId(prefix = "local"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeIdFromEmail(email: string): string {
  const slug = email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `local-${slug || makeRandomLocalId("user")}`;
}

function createUser(
  email: string,
  displayName: string,
  userId: string,
): LocalUser {
  return {
    id: userId,
    email,
    created_at: new Date().toISOString(),
    user_metadata: {
      display_name: displayName,
      full_name: displayName,
      name: displayName,
    },
  };
}

async function loadSession(): Promise<Session | null> {
  if (sessionCache !== undefined) return sessionCache;
  if (!loadPromise) {
    loadPromise = StorageService.get<Session>(
      StorageService.KEYS.AUTH_SESSION,
    ).then((session) => {
      sessionCache = session;
      loadPromise = null;
      return session;
    });
  }
  return loadPromise;
}

async function persistSession(session: Session | null) {
  sessionCache = session;
  if (session) {
    await StorageService.set(StorageService.KEYS.AUTH_SESSION, session);
  } else {
    await StorageService.clear(StorageService.KEYS.AUTH_SESSION);
  }
}

function emit(event: AuthChangeEvent, session: Session | null) {
  listeners.forEach((listener) => listener(event, session));
}

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export const AuthService = {
  async getCurrentUser(): Promise<LocalUser | null> {
    const session = await loadSession();
    return session?.user ?? null;
  },

  async getSession(): Promise<Session | null> {
    return loadSession();
  },

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<{ session: Session | null; error?: string }> {
    if (!email.trim()) return { session: null, error: "Email is required" };
    if (!password.trim())
      return { session: null, error: "Password is required" };
    if (!validateEmail(email))
      return { session: null, error: "Invalid email format" };

    const displayName = email.split("@")[0] || "PLAYER";
    const normalizedEmail = email.trim();
    const session = {
      user: createUser(
        normalizedEmail,
        displayName.toUpperCase(),
        makeIdFromEmail(normalizedEmail),
      ),
    };
    await persistSession(session);
    emit("SIGNED_IN", session);
    return { session };
  },

  async signUp(
    name: string,
    email: string,
    password: string,
  ): Promise<{ session: Session | null; error?: string }> {
    if (!name.trim()) return { session: null, error: "Name is required" };
    if (!email.trim()) return { session: null, error: "Email is required" };
    if (!password.trim())
      return { session: null, error: "Password is required" };
    if (!validateEmail(email))
      return { session: null, error: "Invalid email format" };

    const normalizedEmail = email.trim();
    const session = {
      user: createUser(
        normalizedEmail,
        name.trim().toUpperCase(),
        makeIdFromEmail(normalizedEmail),
      ),
    };
    await persistSession(session);
    emit("SIGNED_IN", session);
    return { session };
  },

  async signInWithGoogle(): Promise<{
    session: Session | null;
    error?: string;
  }> {
    const id = makeRandomLocalId("google");
    const email = `google+${id}@quoridor.local`;
    const session = {
      user: createUser(email, "GOOGLE_PLAYER", id),
    };
    await persistSession(session);
    emit("SIGNED_IN", session);
    return { session };
  },

  async updateUser(updates: {
    data?: Record<string, string>;
    password?: string;
  }): Promise<{ session: Session | null; error?: string }> {
    const session = await loadSession();
    if (!session) return { session: null, error: "No active session" };

    const nextSession: Session = {
      user: {
        ...session.user,
        user_metadata: {
          ...session.user.user_metadata,
          ...(updates.data || {}),
        },
      },
    };
    await persistSession(nextSession);
    emit("USER_UPDATED", nextSession);
    return { session: nextSession };
  },

  async resetPasswordForEmail(email: string): Promise<{ error?: string }> {
    if (!email.trim()) return { error: "Email is required" };
    if (!validateEmail(email)) return { error: "Invalid email format" };
    return {};
  },

  async updatePassword(_password: string): Promise<{ error?: string }> {
    return {};
  },

  async signOut(): Promise<void> {
    await persistSession(null);
    emit("SIGNED_OUT", null);
  },

  onAuthStateChange(callback: Listener) {
    listeners.add(callback);
    void loadSession().then((session) =>
      callback(session ? "SIGNED_IN" : "SIGNED_OUT", session),
    );
    return {
      unsubscribe: () => listeners.delete(callback),
    };
  },

  createDemoSession(
    email = DEFAULT_EMAIL,
    displayName = "ARCHITECT_X",
  ): Session {
    const id = makeRandomLocalId("demo");
    const syntheticEmail =
      email === DEFAULT_EMAIL ? `player+${id}@quoridor.local` : email;
    return { user: createUser(syntheticEmail, displayName, id) };
  },

  async setSession(session: Session | null): Promise<void> {
    await persistSession(session);
    emit(session ? "SIGNED_IN" : "SIGNED_OUT", session);
  },
};
