<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useTyping, type Problem } from '../composables/useTyping';

// 問題リストを拡充
const allProblems: Problem[] = [
  { word: 'インターネット', kana: 'いんたーねっと' },
  { word: '新幹線', kana: 'しんかんせん' },
  { word: '探偵', kana: 'たんてい' },
  { word: '散歩', kana: 'さんぽ' },
  { word: '音楽鑑賞', kana: 'おんがくかんしょう' },
  { word: '切符', kana: 'きっぷ' },
  { word: '北海道', kana: 'ほっかいどう' },
  { word: '合宿', kana: 'がっしゅく' },
  { word: 'ラッコ', kana: 'らっこ' },
  { word: 'ココナッツ', kana: 'ここなっつ' },
  { word: '日本', kana: 'にっぽん' },
  { word: '桜', kana: 'さくら' },
  { word: 'タイピングゲーム', kana: 'たいぴんぐげーむ' },
  { word: 'プログラミング', kana: 'ぷろぐらみんぐ' },
  { word: '寿司', kana: 'すし' },
];

const shuffledProblems = ref<Problem[]>([]);
const currentProblemIndex = ref(0);
const isMistyped = ref(false);

// Fisher-Yates shuffle algorithm
const shuffle = (array: Problem[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const {
  currentDisplayWord,
  fullRomaji,
  typedRomaji,
  currentInput,
  remainingRomaji,
  isFinished,
  setProblem,
  handleKeyInput,
} = useTyping(allProblems[0]); // 初期値として最初の問題を設定

const nextProblem = () => {
  currentProblemIndex.value = (currentProblemIndex.value + 1) % shuffledProblems.value.length;
  setProblem(shuffledProblems.value[currentProblemIndex.value]);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.target !== document.body) return;
  e.preventDefault();

  if (isFinished.value) return;

  if (e.key.length === 1) {
    const correct = handleKeyInput(e.key);
    if (!correct) {
      isMistyped.value = true;
      setTimeout(() => {
        isMistyped.value = false;
      }, 200);
    }
  }
};

// isFinished の状態を監視して自動で次の問題へ
watch(isFinished, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      nextProblem();
    }, 800); // 0.8秒後に次の問題へ
  }
});

onMounted(() => {
  shuffledProblems.value = shuffle([...allProblems]);
  setProblem(shuffledProblems.value[0]);

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
    <div 
      class="w-full max-w-3xl transition-all duration-300 bg-white/20 dark:bg-black/50 backdrop-blur-xl ring-1 ring-gray-200 dark:ring-gray-800 rounded-2xl shadow-2xl"
      :class="{ 'animate-shake': isMistyped }"
    >
      <header class="p-6 border-b border-white/20">
        <h1 class="text-3xl font-bold text-center text-gray-100">
          日本語タイピング
        </h1>
      </header>

      <main class="p-8 text-center space-y-6">
        <p class="text-5xl text-white font-semibold tracking-wider">
          {{ currentDisplayWord }}
        </p>

        <p class="text-xl text-gray-400 font-mono">
          {{ fullRomaji }}
        </p>
        
        <div class="p-5 bg-gray-800/50 rounded-lg text-4xl font-mono tracking-wider relative overflow-hidden">
          <div 
            class="absolute top-0 left-0 h-full bg-green-400/20 transition-all duration-150" 
            :style="{ width: `${(typedRomaji.length / fullRomaji.length) * 100}%` }"
          ></div>
          <span class="relative text-green-400">{{ typedRomaji }}</span>
          <span class="relative text-blue-400 border-b-4 border-blue-500 animate-pulse">{{ currentInput }}</span>
          <span class="relative text-gray-500">{{ remainingRomaji }}</span>
        </div>

        <div class="h-24 transition-opacity duration-500" :class="{ 'opacity-0': !isFinished }">
          <p v-if="isFinished" class="text-2xl font-semibold text-green-400">
            🎉 クリア！ 🎉
          </p>
        </div>
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

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.2s ease-in-out;
}
</style>
