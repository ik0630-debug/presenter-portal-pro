-- Create transportation_info table for speaker transportation details
CREATE TABLE public.transportation_info (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Transportation method
  transportation_method TEXT NOT NULL, -- '대중교통', '자차', 'KTX', '항공', '기타'
  
  -- Journey details
  departure_location TEXT,
  departure_date DATE,
  departure_time TIME,
  arrival_location TEXT,
  arrival_date DATE,
  arrival_time TIME,
  
  -- Vehicle information (for car)
  vehicle_type TEXT,
  vehicle_number TEXT,
  
  -- Public transport details (for train/bus)
  train_number TEXT,
  seat_number TEXT,
  
  -- Flight details
  flight_number TEXT,
  airline TEXT,
  
  -- Cost information
  requires_reimbursement BOOLEAN NOT NULL DEFAULT false,
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  receipt_submitted BOOLEAN NOT NULL DEFAULT false,
  
  -- Additional notes
  notes TEXT,
  
  UNIQUE(session_id)
);

-- Enable RLS
ALTER TABLE public.transportation_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all transportation info"
  ON public.transportation_info
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Speakers can view their own transportation info"
  ON public.transportation_info
  FOR SELECT
  USING (session_id IN (
    SELECT id FROM public.speaker_sessions
    WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
  ));

CREATE POLICY "Speakers can insert their own transportation info"
  ON public.transportation_info
  FOR INSERT
  WITH CHECK (session_id IN (
    SELECT id FROM public.speaker_sessions
    WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
  ));

CREATE POLICY "Speakers can update their own transportation info"
  ON public.transportation_info
  FOR UPDATE
  USING (session_id IN (
    SELECT id FROM public.speaker_sessions
    WHERE email = (current_setting('request.jwt.claims', true)::json->>'email')
  ));

CREATE POLICY "Admins can manage all transportation info"
  ON public.transportation_info
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_transportation_info_updated_at
  BEFORE UPDATE ON public.transportation_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();