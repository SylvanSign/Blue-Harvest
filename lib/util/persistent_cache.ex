defmodule Util.PersistentCache do
  def new(name) when is_atom(name) do
    ^name = :ets.new(name, [:named_table])
  end

  def get(table, key) when is_atom(table) do
    :ets.lookup(table, key)
    |> handle_lookup()
  end

  def put(table, key, value) when is_atom(table) do
    :ets.insert(table, {key, value})
    save(table)
  end

  defp save(table) when is_atom(table) do
    file_path = Util.Priv.get_priv_path(table)
    # Note: :ets.tab2file/2 writes the file asynchronously
    :ets.tab2file(table, String.to_atom(file_path))
  end

  def load(file_path) do
    full_file_path = Util.Priv.get_priv_path(file_path)
    :ets.file2tab(String.to_atom(full_file_path))
  end

  defp handle_lookup([{_key, value}]), do: value
  defp handle_lookup([]), do: nil
end
