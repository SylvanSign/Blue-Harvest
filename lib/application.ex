require Logger

defmodule BlueHarvest.Application do
  use Application

  @port 9000

  def start(_type, _args) do
    # List all child processes to be supervised
    children = [
      # Define workers and child supervisors to be supervised
      Plug.Adapters.Cowboy.child_spec(scheme: :http, plug: Router, options: [port: @port]),
      Data.AlexaSimilarSites,
      Data.SiteDescription,
      Data.Favicon
    ]

    Logger.info("Router listening at http://localhost:#{@port}")

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: BlueHarvest.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
