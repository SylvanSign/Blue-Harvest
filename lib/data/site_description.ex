require Logger
import Util.Priv

defmodule Data.SiteDescription do
  use GenServer

  @name __MODULE__
  @state_file "#{@name}.state"
  @user_agent_pls_no_fbi "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0"
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

        case get_blurb(url) do
          {:ok, description} ->
            descriptions = Map.put(descriptions, url, description)
            save_state(descriptions)
            Logger.info("Serving '#{url}' - Site description - from cache")
            {:reply, description, descriptions}

          {:error, error_message} ->
            Logger.info("Failed to find '#{url}'")
            {:reply, error_message, descriptions}
        end

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
    case File.read(get_priv_path(@state_file)) do
      {:ok, saved_state} -> :erlang.binary_to_term(saved_state)
      {:error, :enoent} -> %{}
    end
  end

  defp save_state(state) do
    binary_state = :erlang.term_to_binary(state)
    File.write!(get_priv_path(@state_file), binary_state)
  end

  defp get_description(html) do
    case Floki.find(html, "meta[name=description]") do
      tags = [_] ->
        content = Floki.attribute(tags, "content")
        hd(content)

      _ ->
        nil
    end
  end

  defp get_title(html) do
    case Floki.find(html, "title") do
      [{_, _, title}] ->
        title

      _ ->
        nil
    end
  end

  defp get_blurb(site) do
    case HTTPoison.get(
           "#{site}",
           %{"User-Agent" => @user_agent_pls_no_fbi},
           recv_timeout: @timeout_ms,
           follow_redirect: true
         ) do
      {:ok, site_content} ->
        body = Map.get(site_content, :body)
        description = get_description(body) || get_title(body)
        {:ok, description}

      _ ->
        {:error, "Failed to find description"}
    end
  end
end
