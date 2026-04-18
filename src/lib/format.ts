import { marked } from 'marked';

export function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function markdownToHtml(markdown: string) {
  return marked.parse(markdown) as string;
}

export function coverGradient(coverStyle: string) {
  const map: Record<string, string> = {
    'purple-dawn': 'linear-gradient(135deg, #9e7bff, #ff9bd2)',
    emerald: 'linear-gradient(135deg, #33d17a, #7cf6c3)',
    ember: 'linear-gradient(135deg, #ff944b, #ffd66b)'
  };
  return map[coverStyle] || map['purple-dawn'];
}
