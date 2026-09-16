import { NextResponse } from "next/server";

/** DESIGN-POOL — chatten är mockad, ingen AI-backend anropas. */
export async function POST() {
  return NextResponse.json({
    response: "Det här är design-poolen — chatten är mockad och anropar ingen AI-tjänst.",
  });
}
