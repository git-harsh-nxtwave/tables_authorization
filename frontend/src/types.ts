export type LevelData = {
    dataset_id: string;
    object_name: string;
    object_type: 'TABLE' | 'VIEW' | 'STORED_PROCEDURE';
    query: string;
  };
  
  export type FormData = {
    [key: `level${number}`]: LevelData;
  };