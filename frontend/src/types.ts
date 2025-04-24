export type LevelData = {
    dataset_id: string;
    object_name: string;
    object_type: 'VIEW' | 'TABLE';
    query: string;
  };
  
  export type FormData = {
    [key: `level${number}`]: LevelData;
  };