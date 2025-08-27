export interface CreateRentalOrderForUserDto {
  rentalDays: number;
  notes?: string;
  bookIds: number[];
  allowPartialOrder?: boolean;
}

export interface SingleBookRentalRequestDto {
  customerId: number;
  bookId: number;
  rentalDays: number;
  orderNotes?: string;
  notes?: string;
}

export interface RentalOrderResponse {
  success: boolean;
  message: string;
  rentalOrderId?: number;
  isPartialOrder?: boolean;
  processedBooks?: any[];
  failedBooks?: any[];
  errorMessage?: string;
}
