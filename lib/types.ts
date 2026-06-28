export type BlueprintRow = {
  id: string;
  user_id: string;
  title: string | null;
  idea_input: string | null;
  brd: string | null;
  prd: string | null;
  market: string | null;
  competitor_data: CompetitorRow[] | null;
  is_public: boolean;
  created_at: string;
};

export type CompetitorRow = {
  name: string;
  pricing: string;
  key_features: string[];
  weaknesses: string[];
  target_customer: string;
};
