// localStorage 저장/불러오기 (접근 불가 환경에서도 앱이 멈추지 않도록 감싼다)
const Storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장 실패는 무시 (시크릿 모드 등)
    }
  },
};

const CUSTOM_KEY = 'bwc.customTopics';

function loadCustomTopics() {
  return Storage.get(CUSTOM_KEY, []);
}

function saveCustomTopic(topic) {
  Storage.set(CUSTOM_KEY, [topic, ...loadCustomTopics()]);
}

function deleteCustomTopic(id) {
  Storage.set(CUSTOM_KEY, loadCustomTopics().filter((t) => t.id !== id));
}

function findTopic(id) {
  return TOPICS.find((t) => t.id === id) || loadCustomTopics().find((t) => t.id === id);
}
