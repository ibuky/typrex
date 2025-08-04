<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { useTyping, type Problem } from '../composables/useTyping';
import { problems as allProblemCategories } from '../constants/problems';
import { levels, getLevelFromScore, type Level } from '../constants/gameMechanics';

// --- State ---
const currentCategory = ref('ことわざ');
const sessionLengthOptions = [10, 25, 50];
const selectedSessionLength = ref(10);
const problemPool = ref<Problem[]>([]);
const problemsCompleted = ref(0);
const isMistyped = ref(false);
const showResultModal = ref(false);

// Session performance stats
const sessionStats = ref({
  totalTypedChars: 0,
  totalMistakes: 0,
  totalTime: 0, // in milliseconds
});
const finalWpm = ref(0);
const finalAccuracy = ref(0);
const finalScore = ref(0);
const finalLevel = ref<Level>(levels[0]);

// --- Template Refs ---
const textContainer = ref<HTMLElement | null>(null);
const typedTextSpan = ref<HTMLElement | null>(null);

// --- Composables ---
const {
  currentDisplayWord,
  fullRomaji,
  typedRomaji,
  currentInput,
  remainingRomaji,
  isFinished,
  mistakeCount,
  elapsedTime,
  setProblem,
  handleKeyInput,
} = useTyping({ word: 'はじめましょう', kana: 'はじめましょう' });

// --- Computed Properties ---
const categories = computed(() => Object.keys(allProblemCategories));

// --- Functions ---
const startNewSession = () => {
  problemsCompleted.value = 0;
  sessionStats.value = { totalTypedChars: 0, totalMistakes: 0, totalTime: 0 };
  showResultModal.value = false;

  const categoryProblems = allProblemCategories[currentCategory.value];
  let sessionProblems: Problem[] = [];
  while (sessionProblems.length < selectedSessionLength.value) {
    const shuffled = [...categoryProblems].sort(() => 0.5 - Math.random());
    sessionProblems.push(...shuffled);
  }
  problemPool.value = sessionProblems.slice(0, selectedSessionLength.value);
  
  setProblem(problemPool.value[0]);
};

const proceedToNextProblem = () => {
  problemsCompleted.value++;
  if (problemsCompleted.value >= selectedSessionLength.value) {
    calculateFinalPerformance();
    showResultModal.value = true;
  } else {
    setProblem(problemPool.value[problemsCompleted.value]);
  }
};

const calculateFinalPerformance = () => {
  const { totalTypedChars, totalMistakes, totalTime } = sessionStats.value;
  const totalTimeInSeconds = totalTime / 1000;
  
  finalWpm.value = totalTimeInSeconds > 0 ? (totalTypedChars / 5) / (totalTimeInSeconds / 60) : 0;

  const totalAttempts = totalTypedChars + totalMistakes;
  finalAccuracy.value = totalAttempts > 0 ? (totalTypedChars / totalAttempts) * 100 : 100;

  // Score = (Total Chars) * (WPM / 10)^2 * (Accuracy Percentage / 100)^3
  const score = (totalTypedChars * Math.pow(finalWpm.value / 10, 2)) * Math.pow(finalAccuracy.value / 100, 3);
  finalScore.value = score;
  finalLevel.value = getLevelFromScore(score);
};

const changeCategory = (category: string) => {
  currentCategory.value = category;
  startNewSession();
};

const changeSessionLength = (length: number) => {
  selectedSessionLength.value = length;
  startNewSession();
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (showResultModal.value) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startNewSession();
    }
    return;
  }

  if (e.target !== document.body || isFinished.value) return;
  e.preventDefault();

  if (e.key.length === 1) {
    const correct = handleKeyInput(e.key);
    if (!correct) {
      isMistyped.value = true;
      setTimeout(() => { isMistyped.value = false; }, 200);
    }
  }
};

// --- Watchers ---
watch(typedRomaji, async () => {
  await nextTick();
  if (!textContainer.value || !typedTextSpan.value) return;
  const container = textContainer.value;
  const typedTextEl = typedTextSpan.value;
  container.scrollLeft = typedTextEl.offsetWidth - (container.clientWidth / 2);
});

watch(isFinished, (newValue) => {
  if (newValue) {
    sessionStats.value.totalTypedChars += fullRomaji.value.length;
    sessionStats.value.totalMistakes += mistakeCount.value;
    sessionStats.value.totalTime += elapsedTime.value;
    
    setTimeout(() => {
      proceedToNextProblem();
    }, 300);
  }
});

// --- Lifecycle Hooks ---
onMounted(() => {
  startNewSession();
  document.body.classList.add('bg-gray-900', 'bg-gradient-to-br', 'from-gray-900', 'to-blue-900');
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.body.classList.remove('bg-gray-900', 'bg-gradient-to-br', 'from-gray-900', 'to-blue-900');
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="flex h-screen font-sans text-gray-100">
    <!-- Left Sidebar -->
    <aside class="w-64 bg-gray-900/50 backdrop-blur-lg p-6 shadow-2xl flex flex-col space-y-8">
      <div>
        <h2 class="text-2xl font-bold mb-4 text-cyan-400">カテゴリ</h2>
        <nav class="flex flex-col space-y-2">
          <button
            v-for="category in categories"
            :key="category"
            @click="changeCategory(category)"
            class="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-lg"
            :class="currentCategory === category ? 'bg-cyan-500/20 text-cyan-300 font-bold ring-1 ring-cyan-500' : 'text-gray-300 hover:bg-white/10'"
          >
            {{ category }}
          </button>
        </nav>
      </div>
      <div>
        <h2 class="text-2xl font-bold mb-4 text-cyan-400">問題数</h2>
        <nav class="flex flex-col space-y-2">
          <button
            v-for="length in sessionLengthOptions"
            :key="length"
            @click="changeSessionLength(length)"
            class="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-lg"
            :class="selectedSessionLength === length ? 'bg-cyan-500/20 text-cyan-300 font-bold ring-1 ring-cyan-500' : 'text-gray-300 hover:bg-white/10'"
          >
            {{ length }} 問
          </button>
        </nav>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col items-center justify-center p-8">
      <header class="w-full max-w-4xl mb-4">
        <div class="text-right text-2xl font-bold text-gray-400">
          {{ problemsCompleted }} / {{ selectedSessionLength }}
        </div>
      </header>
      <main 
        class="w-full max-w-4xl transition-all duration-300 bg-white/20 dark:bg-black/50 backdrop-blur-xl ring-1 ring-gray-200 dark:ring-gray-800 rounded-2xl shadow-2xl"
        :class="{ 'animate-shake': isMistyped }"
      >
        <div class="p-10 text-center space-y-8">
          <p class="text-3xl md:text-5xl text-white font-semibold tracking-wider min-h-[60px]">
            {{ currentDisplayWord }}
          </p>
          
          <div 
            ref="textContainer"
            class="p-5 bg-gray-800/50 rounded-lg text-2xl md:text-4xl font-mono tracking-wider relative overflow-x-auto whitespace-nowrap no-scrollbar"
          >
            <span ref="typedTextSpan" class="text-green-400">{{ typedRomaji }}</span>
            <span class="text-blue-400 border-b-4 border-blue-500 animate-pulse">{{ currentInput }}</span>
            <span class="text-gray-500">{{ remainingRomaji }}</span>
          </div>
        </div>
      </main>
      <footer class="absolute bottom-4 text-gray-500 text-sm">
        日本語の問題をローマ字で入力してください。
      </footer>
    </div>

    <!-- Result Modal -->
    <div v-if="showResultModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg text-center ring-1 ring-cyan-500/50">
        <h2 class="text-4xl font-bold text-cyan-400 mb-6">🎉 セッション完了！ 🎉</h2>
        <div class="grid grid-cols-2 gap-4 text-lg">
          <div class="bg-gray-700/50 p-4 rounded-lg col-span-2">
            <p class="text-gray-400 text-sm">レベル</p>
            <p class="font-bold text-4xl" :class="finalLevel.color">{{ finalLevel.name }}</p>
          </div>
          <div class="bg-gray-700/50 p-4 rounded-lg">
            <p class="text-gray-400 text-sm">スコア</p>
            <p class="text-white font-bold text-3xl">{{ finalScore.toFixed(0) }}</p>
          </div>
           <div class="bg-gray-700/50 p-4 rounded-lg">
            <p class="text-gray-400 text-sm">平均正解率</p>
            <p class="text-white font-bold text-3xl">{{ finalAccuracy.toFixed(1) }}%</p>
          </div>
          <div class="bg-gray-700/50 p-4 rounded-lg col-span-2">
            <p class="text-gray-400 text-sm">平均WPM</p>
            <p class="text-white font-bold text-3xl">{{ finalWpm.toFixed(1) }}</p>
          </div>
        </div>
        <p class="mt-6 text-gray-400">Enterキーで新しいセッションを開始</p>
      </div>
    </div>
  </div>
</template>

<style>
body {
  transition: background-color 0.3s;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
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
