<script setup lang="ts">
import {jwtDecode, type JwtPayload} from "jwt-decode";
import type { ResponseBody } from '@awesome-comment/core/types';

const GoogleClientId = __GOOGLE_CLIENT_ID__;
let intervalId: number | null = null;

const now = ref<number>(Date.now() / 1000 >> 0);
const isStarting = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const isRefreshing = ref<boolean>(false);
const isVerifying = ref<boolean>(false);
const isVerified = ref<boolean>(false);
const accessToken = ref<string>('');
const verifyMessage = ref<string>('');
const decodedToken = computed<JwtPayload>(() => {
  try {
    return jwtDecode<JwtPayload>(accessToken.value);
  } catch (error) {
    return {};
  }
});
const expiredIn = computed<number>(() => {
  const { exp } = decodedToken.value;
  if (!exp) {
    return 0;
  }
  return exp - now.value;
});

function doSignIn(): void {
  initGoogleIdentity();
}
async function onGoogleIdentityCallback(response) {
  isStarting.value = false;
  isLoading.value = true;
  verifyMessage.value = '';
  const result = await $fetch<ResponseBody<{token: string}>>('/api/google-auth', {
    method: 'POST',
    body: {
      credential: response.credential,
    },
  });
  const { data: { token } } = result;
  accessToken.value = token;
  localStorage.setItem('ac-token', token);
  isLoading.value = false;
  isVerified.value = true;
}
function initGoogleIdentity() {
  isStarting.value = true;
  google.accounts.id.initialize({
    client_id: GoogleClientId,
    callback: onGoogleIdentityCallback,
    auto_select: true,
    ux_mode: 'popup',
  });
  google.accounts.id.prompt();
}
function refreshCountDown(): void {
  now.value = Date.now() / 1000 >> 0;
  if (expiredIn.value <= 60) {
    clearInterval(intervalId as number);
    refreshToken();
  }
}
async function refreshToken(): Promise<void> {
  isRefreshing.value = true;
  const result = await $fetch<ResponseBody<{ token: string }>>('/api/refresh-token', {
    method: 'POST',
    body: {
      token: accessToken.value,
    },
  });
  const { data: { token } } = result;
  accessToken.value = token;
  localStorage.setItem('ac-token', token);
  isRefreshing.value = false;
}
async function verifyToken(): Promise<void> {
  isVerifying.value = true;
  const result = await $fetch<ResponseBody<{ verified: boolean, message: string }>>('/api/verify-auth', {
    method: 'POST',
    body: {
      token: accessToken.value,
    },
  });
  const { data: { verified, message = '' } } = result;
  isVerified.value = verified;
  verifyMessage.value = message;
  isVerifying.value = false;
}

watch(expiredIn, value => {
  if (value <= 0) return;

  intervalId = setInterval(refreshCountDown, 1000);
});

onMounted(() => {
  const token = localStorage.getItem('ac-token');
  if (token) {
    accessToken.value = token;
    verifyToken();
    return;
  }

  if ('google' in window) {
    initGoogleIdentity();
  } else {
    window.onGoogleLibraryLoad = initGoogleIdentity;
  }
});
</script>

<template>
  <main class="container max-w-6xl mx-auto py-4">
    <div class="flex items-center gap-4 mb-4">
      <h1 class="text-3xl font-bold mb-4">Google Identity</h1>
      <span v-if="isStarting" class="loading loading-spinner" />
    </div>

    <div class="flex items-center gap-4 mb-1">
      <h3 class="text-lg font-medium">Token:</h3>
      <span
        v-if="isLoading"
        class="loading loading-spinner"
      />
    </div>
    <div v-if="accessToken" class="ps-4">
      <p class="mb-2 text-wrap">{{ accessToken }}</p>
      <p class="whitespace-pre-wrap font-mono mb-2">{{JSON.stringify(decodedToken, null, '  ')}}</p>
      <p class="mb-2">Expired in: {{expiredIn}}s</p>
    </div>

    <div class="ps-4 mb-4">
      <button
        type="button"
        class="btn btn-primary btn-sm"
        @click="doSignIn"
      >
        <i class="bi bi-google" />
        Sign in with Google
      </button>
    </div>
    <div class="flex items-center gap-4 mb-1">
      <h3 class="text-lg font-medium">Verify token:</h3>
      <span
        v-if="isVerifying"
        class="loading loading-spinner"
      />
    </div>
    <p class="ps-4 mb-2">{{ isVerified ? 'Verified' : 'Expired' }}</p>
    <p v-if="verifyMessage" class="ps-4 mb-4">{{verifyMessage}}</p>
    <p>
      <button
        type="button"
        class="btn btn-sm"
        @click="accessToken = ''"
      >Clear token</button>
    </p>
  </main>
</template>
