require Logger

defmodule Data.SiteDescription do
  use GenServer

  @name __MODULE__
  @state_file "data/#{@name}.state"
  @timeout_ms 100_000

  ##############
  # PUBLIC API #
  ##############
  def start_link([]) do
    GenServer.start_link(@name, :ok, name: @name)
  end

  def get_site_description(url) do
    GenServer.call(@name, {:get_site_description, url})
  end

  # TODO remove this function after thouroughly testing this module
  def inspect_state do
    GenServer.call(@name, :inspect)
  end

  ####################
  # SERVER CALLBACKS #
  ####################
  def init(:ok) do
    state = load_state()

    {:ok, state}
  end

  def handle_call({:get_site_description, url}, _from, descriptions) do
    case Map.get(descriptions, url) do
      nil ->
        Logger.info("Cache miss - '#{url}' - Site description - Fetching.")
        description = get_description(url)
        descriptions = Map.put(descriptions, url, description)
        save_state(descriptions)
        {:reply, description, descriptions}

      description ->
        Logger.info("Serving '#{url}' - Site description - from cache")
        {:reply, description, descriptions}
    end
  end

  def handle_call(:inspect, _from, state) do
    {:reply, state, state}
  end

  ###################
  # PRIVATE HELPERS #
  ###################
  defp load_state() do
    case File.read(@state_file) do
      {:ok, saved_state} -> :erlang.binary_to_term(saved_state)
      {:error, :enoent} -> %{}
    end
  end

  defp save_state(state) do
    binary_state = :erlang.term_to_binary(state)
    File.write!(@state_file, binary_state)
  end

  defp get_description(site) do
    HTTPoison.get!("#{site}", %{}, recv_timeout: @timeout_ms, follow_redirect: true)
    |> Map.get(:body)
    |> Floki.find("meta[name=description]")
    |> Floki.attribute("content")
    |> hd()
  end
end