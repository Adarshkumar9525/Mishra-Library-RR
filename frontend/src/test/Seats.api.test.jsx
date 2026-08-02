import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Seats from "../pages/Seats";
import api from "../api/axios";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../components/LoadingSkeleton", () => ({
  TableSkeleton: () => <div>Loading...</div>,
}));

describe("Seats API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    api.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: "1",
            seatNumber: 1,
            slots: {
              morning: {
                status: "occupied",
                student: {
                  name: "Adarsh",
                },
              },
              afternoon: {
                status: "available",
              },
              evening: {
                status: "reserved",
              },
              night: {
                status: "maintenance",
              },
            },
          },
          {
            _id: "2",
            seatNumber: 2,
            slots: {
              morning: {
                status: "available",
              },
              afternoon: {
                status: "occupied",
                student: {
                  name: "Rahul",
                },
              },
              evening: {
                status: "available",
              },
              night: {
                status: "available",
              },
            },
          },
        ],
      },
    });
  });

  it("fetches seats", async () => {
    render(<Seats />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/seats");
    });
  });

 it("changes timing tab", async () => {
  render(<Seats />);

  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });

  fireEvent.click(
    screen.getByLabelText("table-view")
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: "Afternoon",
    })
  );

  await waitFor(() => {
    expect(
      screen.getByText(/Status \(afternoon\)/i)
    ).toBeInTheDocument();
  });
});

    
  it("filters occupied seats", async () => {
    render(<Seats />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /occupied/i,
      })
    );
expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows student in table view", async () => {
    render(<Seats />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    fireEvent.click(
      screen.getByLabelText("table-view")
    );

    expect(
      screen.getByText("Adarsh")
    ).toBeInTheDocument();
  });

  it("shows other shift information", async () => {
    render(<Seats />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    fireEvent.click(
      screen.getByLabelText("table-view")
    );

    expect(
      screen.getByText(
        /Afternoon: available · Evening: reserved · Night: maintenance/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Afternoon: occupied · Evening: available · Night: available/i
      )
    ).toBeInTheDocument();
  });

  it("opens correct seat details", async () => {
    render(<Seats />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "2",
        })
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "2",
      })
    );

    expect(
      screen.getByText(/Seat #2/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText("Rahul")
    ).toBeInTheDocument();
  });
});
