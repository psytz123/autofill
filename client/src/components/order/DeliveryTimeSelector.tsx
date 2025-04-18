import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronUp, Clock, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format, addDays } from "date-fns";

interface DeliveryTimeSelectorProps {
  onSelect: (data: { date: Date; timeSlot: string; repeat: boolean }) => void;
  onClose: () => void;
}

export default function DeliveryTimeSelector({
  onSelect,
  onClose,
}: DeliveryTimeSelectorProps) {
  const today = new Date();
  const nextWeek = addDays(today, 7);
  
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("8:00 PM - 11:59 PM");
  const [repeatWeekly, setRepeatWeekly] = useState<boolean>(false);
  const [showTimeOptions, setShowTimeOptions] = useState<boolean>(false);
  
  const timeSlots = [
    "8:00 AM - 11:59 AM",
    "12:00 PM - 3:59 PM",
    "4:00 PM - 7:59 PM",
    "8:00 PM - 11:59 PM",
  ];
  
  const handleConfirm = () => {
    onSelect({
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      repeat: repeatWeekly,
    });
    onClose();
  };
  
  return (
    <div className="px-4 py-4">
      <h2 className="text-2xl font-bold text-center mb-4">Delivery Time</h2>
      
      {/* Date Selection */}
      <div className="mb-6">
        <div className="text-neutral-600 mb-2">Date</div>
        <div className="flex space-x-4">
          <Card 
            className={`flex-1 cursor-pointer ${selectedDate.getDate() === today.getDate() ? 'border-orange-500' : ''}`}
            onClick={() => setSelectedDate(today)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-lg font-bold uppercase">
                {format(today, "E")}
              </div>
              <div className="text-sm">
                {format(today, "MMM do")}
              </div>
              {selectedDate.getDate() === today.getDate() && (
                <div className="absolute top-2 right-2 text-orange-500">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card 
            className={`flex-1 cursor-pointer ${selectedDate.getDate() === nextWeek.getDate() ? 'border-orange-500' : ''}`}
            onClick={() => setSelectedDate(nextWeek)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-lg font-bold uppercase">
                {format(nextWeek, "E")}
              </div>
              <div className="text-sm">
                {format(nextWeek, "MMM do")}
              </div>
              {selectedDate.getDate() === nextWeek.getDate() && (
                <div className="absolute top-2 right-2 text-orange-500">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Time Selection */}
      <div className="mb-6">
        <div className="text-neutral-600 mb-2">Time (EDT)</div>
        <Card 
          className="w-full cursor-pointer"
          onClick={() => setShowTimeOptions(!showTimeOptions)}
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-500" />
              <span>{selectedTimeSlot}</span>
            </div>
            {showTimeOptions ? (
              <ChevronUp className="h-5 w-5 text-neutral-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-neutral-500" />
            )}
          </CardContent>
        </Card>
        
        {showTimeOptions && (
          <div className="mt-2 border rounded-md overflow-hidden">
            {timeSlots.map((slot) => (
              <div
                key={slot}
                className={`p-4 flex justify-between items-center cursor-pointer border-b last:border-0 ${
                  selectedTimeSlot === slot ? "bg-neutral-100" : ""
                }`}
                onClick={() => {
                  setSelectedTimeSlot(slot);
                  setShowTimeOptions(false);
                }}
              >
                <span>{slot}</span>
                {selectedTimeSlot === slot && (
                  <Check className="h-4 w-4 text-orange-500" />
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="text-red-500 text-sm mt-2">
          Delays may happen for up to 2-3 hours
        </div>
      </div>
      
      {/* Repeat Weekly */}
      <div className="flex items-center justify-between py-2 mb-4">
        <div className="flex items-center text-neutral-700">
          <RefreshCw className="h-5 w-5 mr-2" />
          <span>Repeat Weekly</span>
        </div>
        <Switch 
          checked={repeatWeekly}
          onCheckedChange={setRepeatWeekly}
        />
      </div>
      
      {/* Confirm Button */}
      <Button
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5"
        onClick={handleConfirm}
      >
        CONFIRM DELIVERY TIME
      </Button>
    </div>
  );
}