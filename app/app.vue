<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { useTyping, type Problem } from '../composables/useTyping';
import { problems as allProblemCategories } from '../constants/problems';

// --- State ---
const currentCategory = ref('ことわざ');
const problemPool = ref<Problem[]>([]);
const isMistyped = ref(false);
const showResultModal = ref(false);

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
  wpm,
  accuracy,
  setProblem,
  handleKeyInput,
} = useTyping(allProblemCategories['ことわざ'][0]);

// --- Computed Properties ---
const categories = computed(() => Object.keys(allProblemCategories));

// --- Functions ---
const shuffleAndSetPool = (category: string) => {
  const problems = [...allProblemCategories[category]];
  // Fisher-Yates shuffle
  for (let i = problems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [problems[i], problems[j]] = [problems[j], problems[i]];
  }
  problemPool.value = problems;
};

const nextProblem = () => {
  // Get the next problem from the shuffled pool, or reshuffle if exhausted
  const currentProblemIndex = problemPool.value.findIndex(p => p.kana === fullRomaji.value);
  let nextIndex = currentProblemIndex + 1;
  if (nextIndex >= problemPool.value.length) {
    shuffleAndSetPool(currentCategory.value);
    nextIndex = 0;
  }
  setProblem(problemPool.value[nextIndex]);
};

const changeCategory = (category: string) => {
  currentCategory.value = category;
  shuffleAndSetPool(category);
  setProblem(problemPool.value[0]);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (showResultModal.value) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showResultModal.value = false;
      nextProblem();
    }
    return;
  }

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

// --- Watchers ---
watch(typedRomaji, async () => {
  await nextTick();
  if (!textContainer.value || !typedTextSpan.value) return;

  const container = textContainer.value;
  const typedTextEl = typedTextSpan.value;
  const containerWidth = container.clientWidth;
  const caretPosition = typedTextEl.offsetWidth;
  const centerPoint = containerWidth / 2;
  const desiredScrollLeft = caretPosition - centerPoint;

  container.scrollLeft = desiredScrollLeft > 0 ? desiredScrollLeft : 0;
});

watch(isFinished, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      showResultModal.value = true;
    }, 200);
  }
});

// --- Lifecycle Hooks ---
onMounted(() => {
  changeCategory(currentCategory.value);
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
    <!-- Left Sidebar for Category Selection -->
    <aside class="w-64 bg-gray-900/50 backdrop-blur-lg p-6 shadow-2xl flex flex-col">
      <h2 class="text-2xl font-bold mb-6 text-cyan-400">カテゴリ</h2>
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
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col items-center justify-center p-8">
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
      <div class="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center ring-1 ring-cyan-500/50">
        <h2 class="text-4xl font-bold text-cyan-400 mb-6">🎉 クリア！ 🎉</h2>
        <div class="grid grid-cols-2 gap-4 text-lg">
          <div class="bg-gray-700/50 p-4 rounded-lg">
            <p class="text-gray-400 text-sm">WPM</p>
            <p class="text-white font-bold text-3xl">{{ wpm.toFixed(1) }}</p>
          </div>
          <div class="bg-gray-700/50 p-4 rounded-lg">
            <p class="text-gray-400 text-sm">正解率</p>
            <p class="text-white font-bold text-3xl">{{ accuracy.toFixed(1) }}%</p>
          </div>
        </div>
        <p class="mt-6 text-gray-400">Enterキーで次の問題へ</p>
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
