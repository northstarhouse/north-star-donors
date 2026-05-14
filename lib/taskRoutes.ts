export const GRANTS_OVERVIEW_TASK_ID = '1358d1dc-9281-4c48-a45a-4b9d303d7c59'
export const GRANTS_OVERVIEW_HREF = '/grants/prototype/'

export function taskHref(taskId: string) {
  return taskId === GRANTS_OVERVIEW_TASK_ID ? GRANTS_OVERVIEW_HREF : `/task?taskId=${taskId}`
}
