<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useTyping } from '../composables/useTyping';

const problems = ['さくら', 'にっぽん', 'かった', 'けんい', 'タイピングゲーム', 'プログラミング'];
const currentProblemIndex = ref(0);

const {
  problem,
  currentInput,
  isFinished,
  remainingKana,
  typedRomaji,
  setProblem,
  handleKeyInput,
} = useTyping(problems[currentProblemIndex.value]);

const nextProblem = () => {
  currentProblemIndex.value = (currentProblemIndex.value + 1) % problems.length;
  setProblem(problems[currentProblemIndex.value]);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.target !== document.body) return;
  e.preventDefault();

  if (e.key === 'Enter' && isFinished.value) {
    nextProblem();
    return;
  }
  
  if (e.key.length === 1 && e.key >= 'a' && e.key <= 'z') {
    handleKeyInput(e.key);
  }
};

onMounted(() => {
  document.body.classList.add('bg-gray-900', 'bg-gradient-to-br', 'from-gray-900', 'to-blue-900');
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.body.classList.remove('bg-gray-900', 'bg-gradient-to-br', 'from-gray-900', 'to-blue-900');
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen font-sans">
    <div class="w-full max-w-3xl transition-all duration-300 bg-white/20 dark:bg-black/50 backdrop-blur-xl ring-1 ring-gray-200 dark:ring-gray-800 rounded-2xl shadow-2xl">
      <header class="p-6 border-b border-white/20">
        <h1 class="text-3xl font-bold text-center text-gray-100">
          日本語タイピング
        </h1>
      </header>

      <main class="p-8 text-center space-y-6">
        <p class="text-2xl text-gray-300 font-medium">
          {{ problem.map(p => p.kana).join('') }}
        </p>
        
        <div class="p-5 bg-gray-800/50 rounded-lg text-4xl font-mono tracking-wider relative overflow-hidden">
          <div class="absolute top-0 left-0 h-full bg-green-400/20 transition-all duration-150" :style="{ width: `${(typedRomaji.length / (typedRomaji.length + remainingKana.length)) * 100}%` }"></div>
          <span class="relative text-green-400">{{ typedRomaji }}</span>
          <span class="relative text-blue-400 border-b-4 border-blue-500 animate-pulse">{{ currentInput }}</span>
          <span class="relative text-gray-500">{{ remainingKana.substring(currentInput.length) }}</span>
        </div>

        <div v-if="isFinished" class="p-4 transition-opacity duration-500">
          <p class="text-2xl font-semibold text-green-400">
            🎉 クリア！ 🎉
          </p>
          <button @click="nextProblem" class="mt-6 px-6 py-3 bg-sky-500 text-white font-bold rounded-lg shadow-lg hover:bg-sky-600 transition-colors duration-300">
            次の問題へ (Enter)
          </button>
        </div>
        <div v-else class="h-24">&nbsp;</div>
      </main>

      <footer class="p-6 border-t border-white/20">
        <div class="text-center text-sm text-gray-400">
          日本語の問題をローマ字で入力してください。
        </div>
      </footer>
    </div>
  </div>
</template>

<style>
body {
  transition: background-color 0.3s;
}
</style>